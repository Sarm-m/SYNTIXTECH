import React, { useRef, useState } from 'react';
import DinoGameOverlay from '@/components/DinoGameOverlay.jsx';
import { Helmet } from 'react-helmet';
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage.js';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import AlertHubSingleton from '@/patterns/singleton/AlertHubSingleton.js';
import {
  MAX_BACKUP_FILE_BYTES,
  buildBackupFileName,
  buildBackupTemplatePayload,
  buildSampleBackupPayload,
  downloadExcelBackup,
  downloadJsonBackup,
  exportOperationalBackup,
  importOperationalBackup,
  parseExcelBackup,
  parseJsonBackup,
  resetOperationalData,
  summarizeBackupPayload,
  validateBackupPayload,
} from '@/utils/dataBackup.js';

const getMessageClassName = (type, isDarkMode) => {
  if (type === 'success') {
    return isDarkMode
      ? 'border-emerald-900 bg-emerald-950/70 text-emerald-300'
      : 'border-green-200 bg-green-50 text-green-800';
  }

  return isDarkMode
    ? 'border-red-950 bg-red-950/70 text-red-300'
    : 'border-red-200 bg-red-50 text-red-800';
};

const formatImportSummary = (summary) => [
  `Vehiculos procesados: ${summary.vehiculos.processed}`,
  `Conductores procesados: ${summary.conductores.processed}`,
  `SOAT procesados: ${summary.soats.processed}`,
  `RTM procesados: ${summary.rtms.processed}`,
  `Errores: ${summary.errors.length}`,
].join(' | ');

const entityPreviewLabels = [
  ['vehiculos', 'Vehiculos'],
  ['conductores', 'Conductores'],
  ['soats', 'SOAT'],
  ['rtms', 'RTM'],
  ['validaciones', 'Validaciones'],
];

const formatPreviewSummary = (summary) =>
  entityPreviewLabels
    .map(([key, label]) => {
      const validCount = summary.validCounts?.[key] ?? summary[key];
      return `${label}: detectados ${summary[key]}, validos ${validCount}`;
    })
    .concat(`Errores: ${summary.recordErrors.length}`)
    .join(' | ');

const formatPreviewError = (error) =>
  `${error.sheet || error.entity} fila ${error.rowNumber || error.index + 2}: ${error.message}`;

const dataSteps = [
  { id: 'resumen', label: 'Resumen', icon: ClipboardList },
  { id: 'exportar', label: 'Exportar', icon: Download },
  { id: 'importar', label: 'Importar', icon: Upload },
  { id: 'plantillas', label: 'Plantillas', icon: FileSpreadsheet },
  { id: 'restablecer', label: 'Restablecer', icon: RotateCcw },
];

const includedEntities = ['Vehiculos', 'Conductores', 'SOAT', 'RTM', 'Validaciones', 'Preferencias'];

export default function ConfiguracionPage() {
  const [threshold, setThreshold] = useLocalStorage('syntix_threshold', 15);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeDataStep, setActiveDataStep] = useState('resumen');
  const [importFormat, setImportFormat] = useState('json');
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');
  const [busyDone, setBusyDone] = useState(false);
  const [busyDoneMessage, setBusyDoneMessage] = useState('');
  const reloadOnClose = useRef(false);
  const fileInputRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  const closeBusyOverlay = () => {
    setIsBusy(false);
    setBusyDone(false);
    setBusyDoneMessage('');
    setBusyMessage('');

    if (reloadOnClose.current) {
      reloadOnClose.current = false;
      globalThis.location.reload();
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 8000);
  };

  const handleExportBackup = async (format = 'json') => {
    if (!user?.email) {
      showMessage('error', 'Debes iniciar sesion para exportar un respaldo.');
      return;
    }

    setIsBusy(true);
    setBusyMessage('Exportando datos...');
    setBusyDone(false);
    setBusyDoneMessage('');
    reloadOnClose.current = false;
    try {
      const payload = await exportOperationalBackup(user.email);
      if (format === 'excel') {
        downloadExcelBackup(payload, buildBackupFileName(new Date(), 'xlsx'));
      } else {
        downloadJsonBackup(payload, buildBackupFileName());
      }
      setBusyDoneMessage(`Respaldo ${format === 'excel' ? 'Excel' : 'JSON'} exportado correctamente.`);
      setBusyDone(true);
    } catch (error) {
      console.error('Error exportando respaldo.', error);
      showMessage('error', error.message || 'Error al exportar el respaldo.');
      setIsBusy(false);
    }
  };

  const handleChooseImportFile = (format) => {
    setImportFormat(format);
    setImportPreview(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_BACKUP_FILE_BYTES) {
      showMessage('error', 'El archivo supera el tamano maximo permitido (5 MB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setBusyMessage('');
    setBusyDone(false);
    setBusyDoneMessage('');
    reloadOnClose.current = false;
    setIsBusy(true);
    try {
      const format = importFormat === 'excel' || file.name.toLowerCase().endsWith('.xlsx') ? 'excel' : 'json';
      const payload = format === 'excel'
        ? await parseExcelBackup(await file.arrayBuffer())
        : parseJsonBackup(await file.text());
      const validation = validateBackupPayload(payload);
      const summary = summarizeBackupPayload(payload);

      setImportPreview({
        fileName: file.name,
        format,
        payload,
        summary,
        validation,
      });

      if (validation.valid) {
        showMessage('success', 'Archivo validado. Revisa el resumen antes de importar.');
      } else {
        showMessage('error', 'El archivo tiene errores criticos. Corrigelos antes de importar.');
      }
    } catch (error) {
      console.error('Error validando respaldo.', error);
      setImportPreview(null);
      showMessage('error', error.message || 'El archivo no es un respaldo valido de Drive Control.');
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImportBackup = async () => {
    if (!importPreview?.payload || !importPreview.validation.valid) {
      showMessage('error', 'Primero valida un archivo sin errores criticos.');
      return;
    }

    setIsBusy(true);
    setBusyMessage('Importando datos a MongoDB...');
    setBusyDone(false);
    setBusyDoneMessage('');
    reloadOnClose.current = false;
    try {
      const summary = await importOperationalBackup(importPreview.payload);
      setImportResult(summary);
      setImportPreview(null);
      const hasImportErrors = summary.errors.length > 0;
      const summaryText = formatImportSummary(summary);
      if (hasImportErrors) {
        setBusyDoneMessage(`Importacion parcial. ${summaryText}`);
      } else {
        reloadOnClose.current = true;
        setBusyDoneMessage(`Respaldo importado correctamente. ${summaryText}`);
      }
      setBusyDone(true);
    } catch (error) {
      console.error('Error importando respaldo.', error);
      showMessage('error', error.message || 'No fue posible importar el respaldo.');
      setIsBusy(false);
    }
  };

  const handleDownloadTemplate = (format, sample = false) => {
    const payload = sample ? buildSampleBackupPayload() : buildBackupTemplatePayload();
    const namePrefix = sample ? 'drivecontrol-sample-backup' : 'drivecontrol-template';

    if (format === 'excel') {
      downloadExcelBackup(payload, `${namePrefix}.xlsx`);
    } else {
      downloadJsonBackup(payload, `${namePrefix}.json`);
    }
  };

  const handleResetData = async () => {
    if (!user?.email) {
      showMessage('error', 'Debes iniciar sesion para restablecer datos.');
      return;
    }

    setIsBusy(true);
    setBusyMessage('Restableciendo datos...');
    setBusyDone(false);
    setBusyDoneMessage('');
    reloadOnClose.current = false;
    try {
      await resetOperationalData(user.email);
      AlertHubSingleton.getInstance().reset();
      setResetConfirmation('');
      reloadOnClose.current = true;
      setBusyDoneMessage('Datos operativos restablecidos correctamente.');
      setBusyDone(true);
    } catch (error) {
      console.error('Error restableciendo datos.', error);
      showMessage('error', error.message || 'No fue posible restablecer los datos.');
      setIsBusy(false);
    }
  };

  const messageClassName = getMessageClassName(message.type, isDarkMode);
  const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-600';
  const panelClass = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white';
  const softPanelClass = isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-gray-200 bg-gray-50';
  const actionButtonClass = isDarkMode
    ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100';
  const primaryButtonClass = 'bg-syntix-navy text-white hover:bg-syntix-navy/90';

  return (
    <>
      {isBusy && busyMessage && (
        <DinoGameOverlay
          message={busyMessage}
          done={busyDone}
          doneMessage={busyDoneMessage}
          onClose={closeBusyOverlay}
        />
      )}

      <div className="space-y-6 max-w-4xl">
      <Helmet>
        <title>Configuracion | SYNTIX Drive Control</title>
      </Helmet>

      <div data-onboarding="settings-header">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-syntix-navy'}`}>Configuracion del Sistema</h1>
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Ajustes generales y gestion de datos</p>
      </div>

      {message.text && (
        <div className={`flex items-center gap-3 rounded-lg border p-4 ${messageClassName}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className={`overflow-hidden rounded-2xl border shadow-sm ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'
      }`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <h2 className={`mb-4 flex items-center gap-2 text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
            <Settings className={`w-5 h-5 ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`} /> Parametros de Alertas
          </h2>
          <div className="mb-6">
            <ThemeToggle label="Modo oscuro" />
          </div>
          <div data-onboarding="settings-threshold" className="max-w-md">
            <label htmlFor="settings-threshold-input" className={`mb-2 block text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
              Umbral de Alerta Amarilla (Dias)
            </label>
            <div className="flex gap-4">
              <input
                id="settings-threshold-input"
                type="number"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-syntix-green ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-950 text-slate-100'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
                min="1"
                max="60"
              />
              <button data-onboarding="settings-save-button" onClick={() => showMessage('success', 'Umbral guardado correctamente.')} className="bg-syntix-navy text-white px-4 py-2 rounded-lg font-medium hover:bg-syntix-navy/90 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
            <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Los documentos se marcaran en amarillo cuando falten {threshold} dias o menos para su vencimiento.
            </p>
          </div>
        </div>

        <div data-onboarding="settings-data-management" className={`p-6 ${isDarkMode ? 'bg-slate-950/60' : 'bg-gray-50'}`}>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={`mb-2 flex items-center gap-2 text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                <Database className={`w-5 h-5 ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`} /> Gestion de Datos
              </h2>
              <p className={`text-sm ${mutedTextClass}`}>
                Respalda, valida e importa datos operativos del usuario autenticado. Las alertas se recalculan automaticamente.
              </p>
            </div>
            <div className={`flex items-center gap-2 text-xs font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <ShieldCheck className="h-4 w-4" /> Sin credenciales ni owner del archivo
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {dataSteps.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveDataStep(id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  activeDataStep === id
                    ? 'border-syntix-green bg-syntix-green text-syntix-navy'
                    : actionButtonClass
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <input
            type="file"
            accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportBackup}
          />

          {activeDataStep === 'resumen' && (
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Exportar datos', 'JSON o Excel con vehiculos, conductores, SOAT, RTM, validaciones y preferencias permitidas.', Download, 'exportar'],
                ['Importar datos', 'Selecciona un archivo, valida errores y confirma la importacion despues del resumen.', Upload, 'importar'],
                ['Plantillas', 'Descarga archivos vacios o ejemplos realistas para preparar cargas masivas.', FileSpreadsheet, 'plantillas'],
                ['Restablecer datos', 'Limpia datos operativos sin borrar cuenta, token ni credenciales.', AlertTriangle, 'restablecer'],
              ].map(([title, description, Icon, step]) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setActiveDataStep(step)}
                  className={`rounded-lg border p-4 text-left transition-colors ${panelClass}`}
                >
                  <Icon className={`mb-3 h-5 w-5 ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`} />
                  <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{title}</p>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>{description}</p>
                </button>
              ))}
            </div>
          )}

          {activeDataStep === 'exportar' && (
            <div className={`rounded-lg border p-4 ${panelClass}`}>
              <p className={`mb-3 text-sm ${mutedTextClass}`}>El respaldo incluye:</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {includedEntities.map((entity) => (
                  <span key={entity} className={`rounded-md border px-2 py-1 text-xs font-medium ${softPanelClass}`}>{entity}</span>
                ))}
              </div>
              <p className={`mb-4 text-sm ${mutedTextClass}`}>Las alertas no se exportan porque se calculan automaticamente desde vencimientos.</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" data-onboarding="settings-export" onClick={() => handleExportBackup('json')} disabled={isBusy} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 ${actionButtonClass}`}>
                  <FileJson className="h-4 w-4" /> Exportar JSON
                </button>
                <button type="button" onClick={() => handleExportBackup('excel')} disabled={isBusy} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 ${actionButtonClass}`}>
                  <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
                </button>
              </div>
            </div>
          )}

          {activeDataStep === 'importar' && (
            <div className="space-y-4">
              <div className={`rounded-lg border p-4 ${panelClass}`}>
                <p className={`mb-4 text-sm ${mutedTextClass}`}>Primero se valida el archivo y luego eliges si confirmar la importacion.</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" data-onboarding="settings-import" onClick={() => handleChooseImportFile('json')} disabled={isBusy} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 ${actionButtonClass}`}>
                    <FileJson className="h-4 w-4" /> Importar JSON
                  </button>
                  <button type="button" onClick={() => handleChooseImportFile('excel')} disabled={isBusy} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 ${actionButtonClass}`}>
                    <FileSpreadsheet className="h-4 w-4" /> Importar Excel
                  </button>
                </div>
              </div>

              {importPreview && (
                <div className={`rounded-lg border p-4 ${importPreview.validation.valid ? panelClass : 'border-red-200 bg-red-50 text-red-900'}`}>
                  <p className="text-sm font-bold">Resumen previo: {importPreview.fileName}</p>
                  <p className="mt-1 text-sm">{formatPreviewSummary(importPreview.summary)}</p>
                  {importPreview.validation.recordErrors.length > 0 && (
                    <ul className="mt-3 max-h-40 overflow-auto text-sm">
                      {importPreview.validation.recordErrors.slice(0, 8).map((error) => (
                        <li key={`${error.entity}-${error.index}-${error.message}`}>
                          {formatPreviewError(error)}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" onClick={handleConfirmImportBackup} disabled={isBusy || !importPreview.validation.valid} className={`mt-4 rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${primaryButtonClass}`}>
                    Confirmar importacion
                  </button>
                </div>
              )}

              {importResult && (
                <div className={`rounded-lg border p-4 ${softPanelClass}`}>
                  <p className="text-sm font-bold">Resultado final</p>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>{formatImportSummary(importResult)}</p>
                  {importResult.errors.length > 0 && (
                    <ul className={`mt-3 max-h-40 overflow-auto text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                      {importResult.errors.slice(0, 10).map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {activeDataStep === 'plantillas' && (
            <div className={`rounded-lg border p-4 ${panelClass}`}>
              <p className={`mb-4 text-sm ${mutedTextClass}`}>Las plantillas vienen vacias; los ejemplos incluyen datos realistas DCV101-DCV110.</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => handleDownloadTemplate('json')} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${actionButtonClass}`}>
                  <FileJson className="h-4 w-4" /> Plantilla JSON
                </button>
                <button type="button" onClick={() => handleDownloadTemplate('excel')} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${actionButtonClass}`}>
                  <FileSpreadsheet className="h-4 w-4" /> Plantilla Excel
                </button>
                <button type="button" onClick={() => handleDownloadTemplate('json', true)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${actionButtonClass}`}>
                  <FileJson className="h-4 w-4" /> Ejemplo JSON
                </button>
                <button type="button" onClick={() => handleDownloadTemplate('excel', true)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${actionButtonClass}`}>
                  <FileSpreadsheet className="h-4 w-4" /> Ejemplo Excel
                </button>
              </div>
            </div>
          )}

          {activeDataStep === 'restablecer' && (
            <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-red-950 bg-red-950/30' : 'border-red-200 bg-red-50'}`}>
              <p className={`font-bold ${isDarkMode ? 'text-red-300' : 'text-syntix-red'}`}>Restablecer datos operativos</p>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>
                Esto elimina vehiculos, conductores, SOAT, RTM y validaciones del usuario actual. No borra tu cuenta ni tus credenciales.
              </p>
              <label htmlFor="reset-confirmation" className={`mt-4 block text-sm font-medium ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>
                Escribe RESTABLECER para continuar
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="reset-confirmation"
                  value={resetConfirmation}
                  onChange={(event) => setResetConfirmation(event.target.value)}
                  className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 ${
                    isDarkMode ? 'border-red-950 bg-slate-950 text-slate-100' : 'border-red-200 bg-white text-gray-900'
                  }`}
                />
                <button type="button" data-onboarding="settings-reset" onClick={handleResetData} disabled={isBusy || resetConfirmation !== 'RESTABLECER'} className="flex items-center justify-center gap-2 rounded-lg bg-syntix-red px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60">
                  <AlertTriangle className="h-4 w-4" /> Restablecer Datos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
