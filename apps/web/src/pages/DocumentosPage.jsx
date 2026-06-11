import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Search, Shield, Wrench, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useDocuments } from '@/hooks/useDocuments.js';
import { useRtm } from '@/contexts/RtmContext.jsx';
import { useVehicles } from '@/hooks/useVehicles.js';
import ModalFactory from '@/components/ModalFactory.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import useModalManager from '@/hooks/useModalManager.js';
import EditSoatModal from '@/components/EditSoatModal.jsx';
import EditRtmModal from '@/components/EditRtmModal.jsx';
import { formatColombianDate, getDocumentStatusReason, getExpirationAlertText, getStatusLabel } from '@/utils/dateUtils.js';
import { isValidPlate, normalizePlate } from '@/utils/colombiaFormats.js';
import { ConfirmDialog, EmptyState, PageHeader } from '@/components/UI/SaasUI.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

const UNKNOWN_VEHICLE_LABEL = 'Vehículo no encontrado';

const normalizeSearchText = (value) => String(value ?? '').toLowerCase().trim();

const getVehicleLabel = (vehiculo) => {
  const placa = normalizePlate(vehiculo?.placa || '');
  if (!vehiculo || !isValidPlate(placa)) return UNKNOWN_VEHICLE_LABEL;
  return placa;
};

const getDocumentPlate = (documento) => {
  const placa = normalizePlate(documento.placaVehiculo || documento.placa || '');
  return isValidPlate(placa) ? placa : '';
};

const getVehicleSubtitle = (vehiculo) => {
  if (!vehiculo) return '';
  return vehiculo.tipo || 'Otro';
};

const matchesSearch = (values, searchTerm) => {
  const query = normalizeSearchText(searchTerm);
  if (!query) return true;
  return values.some((value) => normalizeSearchText(value).includes(query));
};

const getStatusSearchValues = (estado) => [
  estado,
  getStatusLabel(estado),
  estado === 'verde' ? 'al dia vigente' : '',
  estado === 'amarillo' ? 'por vencer proximo' : '',
  estado === 'rojo' ? 'critico vencido' : '',
];

// DocumentosPage organiza SOAT y RTM en una sola vista para que el usuario
// revise el estado documental sin saltar entre dos módulos distintos.
export default function DocumentosPage() {
  const { soats, removeSoat } = useDocuments();
  const { rtms, removeRtm } = useRtm();
  const { vehiculos } = useVehicles();
  const { isDarkMode } = useTheme();
  const toast = useToast();
  const { activeModal, openModal, closeModal } = useModalManager();

  const [soatEditando, setSoatEditando] = useState(null);
  const [rtmEditando, setRtmEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [soatSearch, setSoatSearch] = useState('');
  const [rtmSearch, setRtmSearch] = useState('');

  const getVehiculo = (vehiculoId) =>
    vehiculos.find((v) => String(v.id) === String(vehiculoId));

  const filteredSoats = useMemo(
    () =>
      soats.filter((soat) => {
        // Se indexan tanto placa como fechas y estado para permitir búsquedas
        // operativas más flexibles en una tabla grande.
        const vehiculo = getVehiculo(soat.vehiculoId);
        const placa = getVehicleLabel(vehiculo);
        return matchesSearch(
          [
            placa,
            getDocumentPlate(soat),
            soat.numeroPoliza,
            soat.aseguradora,
            soat.fechaFinVigencia,
            formatColombianDate(soat.fechaFinVigencia),
            ...getStatusSearchValues(soat.estado),
          ],
          soatSearch
        );
      }),
    [soats, soatSearch, vehiculos]
  );

  const filteredRtms = useMemo(
    () =>
      rtms.filter((rtm) => {
        const vehiculo = getVehiculo(rtm.vehiculoId);
        const placa = getVehicleLabel(vehiculo);
        return matchesSearch(
          [
            placa,
            getDocumentPlate(rtm),
            rtm.numeroCertificado,
            rtm.numeroRtm,
            rtm.cda,
            rtm.resultado,
            rtm.fechaVencimiento,
            formatColombianDate(rtm.fechaVencimiento),
            ...getStatusSearchValues(rtm.estado),
          ],
          rtmSearch
        );
      }),
    [rtms, rtmSearch, vehiculos]
  );

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.tipo === 'soat') await removeSoat(confirmDelete.id);
      if (confirmDelete.tipo === 'rtm') await removeRtm(confirmDelete.id);
      toast.success('Documento eliminado correctamente.');
    } catch {
      toast.error('No pudimos eliminar el documento. Intenta nuevamente.');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Documentos | SYNTIX Drive Control</title>
      </Helmet>

      <div data-onboarding="documents-header">
        <PageHeader
          eyebrow="Cumplimiento documental"
          title="Gestión de documentos"
          description="Controla pólizas SOAT y revisiones técnico-mecánicas asociadas a cada vehículo."
          actions={<>
          <button
            type="button"
            onClick={() => openModal('addDocument')}
            data-onboarding="documents-add-soat"
            className="btn-primary"
          >
            + Registrar SOAT
          </button>
          <button
            type="button"
            onClick={() => openModal('addRtm')}
            data-onboarding="documents-add-rtm"
            className="btn-secondary"
          >
            + Registrar RTM
          </button>
          </>}
        />
      </div>

      <DocumentTableShell
        onboardingId="documents-soat-table"
        icon={Shield}
        title="Polizas SOAT"
        count={filteredSoats.length}
        total={soats.length}
        searchTerm={soatSearch}
        onSearchChange={setSoatSearch}
        placeholder="Buscar SOAT por placa, poliza, aseguradora, estado o vencimiento..."
        isDarkMode={isDarkMode}
      >
        {filteredSoats.length === 0 ? (
          <div className="p-4 md:hidden">
            <EmptyState
              icon={Shield}
              title={soats.length > 0 ? 'No encontramos pólizas SOAT' : 'No hay documentos SOAT registrados todavía'}
              description={soats.length > 0 ? 'Prueba con otro criterio de búsqueda.' : 'Carga el primer SOAT para recibir alertas antes de su vencimiento.'}
              actionLabel={soats.length > 0 ? undefined : 'Registrar SOAT'}
              onAction={soats.length > 0 ? undefined : () => openModal('addDocument')}
              compact
            />
          </div>
        ) : (
          <div className="space-y-3 p-4 md:hidden">
            {filteredSoats.map((soat) => {
              const vehiculo = getVehiculo(soat.vehiculoId);
              return <DocumentMobileCard key={soat.id} type="SOAT" plate={getVehicleLabel(vehiculo)} code={soat.numeroPoliza} entity={soat.aseguradora} expiration={soat.fechaFinVigencia} status={soat.estado} onEdit={() => setSoatEditando(soat)} onDelete={() => setConfirmDelete({ tipo: 'soat', id: soat.id, nombre: soat.numeroPoliza })} isDarkMode={isDarkMode} />;
            })}
          </div>
        )}
        <table className="hidden w-full min-w-[1100px] md:table">
          <thead className={`text-left ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Vehículo</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>N° Poliza</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Aseguradora</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Inicio</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Vencimiento</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Estado</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSoats.length === 0 ? (
              <EmptyRows colSpan={7} hasData={soats.length > 0} isDarkMode={isDarkMode} />
            ) : (
              filteredSoats.map((soat) => {
                const vehiculo = getVehiculo(soat.vehiculoId);
                const placa = getVehicleLabel(vehiculo);
                const expirationText = getExpirationAlertText(soat.diasRestantes, soat.fechaFinVigencia);
                const statusReason = getDocumentStatusReason({
                  documentLabel: 'SOAT',
                  daysRemaining: soat.diasRestantes,
                  status: soat.estado,
                });

                return (
                  <tr key={soat.id} className={`border-t ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/70' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{placa}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{getVehicleSubtitle(vehiculo)}</div>
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{soat.numeroPoliza}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{soat.aseguradora || 'Sin dato'}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{formatColombianDate(soat.fechaInicioVigencia)}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <div>{formatColombianDate(soat.fechaFinVigencia)}</div>
                      <div className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{expirationText.primaryText}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={soat.estado} />
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {statusReason}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RowActions
                        onEdit={() => setSoatEditando(soat)}
                        onDelete={() => setConfirmDelete({ tipo: 'soat', id: soat.id, nombre: soat.numeroPoliza })}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DocumentTableShell>

      <DocumentTableShell
        onboardingId="documents-rtm-table"
        icon={Wrench}
        title="Revisiones Tecnico-Mecanicas"
        count={filteredRtms.length}
        total={rtms.length}
        searchTerm={rtmSearch}
        onSearchChange={setRtmSearch}
        placeholder="Buscar RTM por placa, certificado, CDA, resultado, estado o vencimiento..."
        isDarkMode={isDarkMode}
      >
        {filteredRtms.length === 0 ? (
          <div className="p-4 md:hidden">
            <EmptyState
              icon={Wrench}
              title={rtms.length > 0 ? 'No encontramos revisiones RTM' : 'No hay revisiones RTM registradas todavía'}
              description={rtms.length > 0 ? 'Prueba con otro criterio de búsqueda.' : 'Registra la primera RTM para mantener su vencimiento bajo control.'}
              actionLabel={rtms.length > 0 ? undefined : 'Registrar RTM'}
              onAction={rtms.length > 0 ? undefined : () => openModal('addRtm')}
              compact
            />
          </div>
        ) : (
          <div className="space-y-3 p-4 md:hidden">
            {filteredRtms.map((rtm) => {
              const vehiculo = getVehiculo(rtm.vehiculoId);
              return <DocumentMobileCard key={rtm.id} type="RTM" plate={getVehicleLabel(vehiculo)} code={rtm.numeroCertificado} entity={rtm.cda} expiration={rtm.fechaVencimiento} status={rtm.estado} onEdit={() => setRtmEditando(rtm)} onDelete={() => setConfirmDelete({ tipo: 'rtm', id: rtm.id, nombre: rtm.numeroCertificado })} isDarkMode={isDarkMode} />;
            })}
          </div>
        )}
        <table className="hidden w-full min-w-[1100px] md:table">
          <thead className={`text-left ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Vehículo</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Certificado</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>CDA</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Resultado</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Vencimiento</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Estado</th>
              <th className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRtms.length === 0 ? (
              <EmptyRows colSpan={7} hasData={rtms.length > 0} isDarkMode={isDarkMode} />
            ) : (
              filteredRtms.map((rtm) => {
                const vehiculo = getVehiculo(rtm.vehiculoId);
                const placa = getVehicleLabel(vehiculo);
                const expirationText = getExpirationAlertText(rtm.diasRestantes, rtm.fechaVencimiento);
                const statusReason = getDocumentStatusReason({
                  documentLabel: 'RTM',
                  daysRemaining: rtm.diasRestantes,
                  status: rtm.estado,
                });

                return (
                  <tr key={rtm.id} className={`border-t ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/70' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{placa}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{getVehicleSubtitle(vehiculo)}</div>
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{rtm.numeroCertificado}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{rtm.cda || 'Sin dato'}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{rtm.resultado || 'Sin dato'}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <div>{formatColombianDate(rtm.fechaVencimiento)}</div>
                      <div className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{expirationText.primaryText}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={rtm.estado} />
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {statusReason}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RowActions
                        onEdit={() => setRtmEditando(rtm)}
                        onDelete={() => setConfirmDelete({ tipo: 'rtm', id: rtm.id, nombre: rtm.numeroCertificado })}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DocumentTableShell>

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Eliminar documento"
        description={`Vas a eliminar ${confirmDelete?.nombre || 'este documento'}. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        busy={deleting}
        destructive
      />

      <EditSoatModal isOpen={!!soatEditando} soat={soatEditando} onClose={() => setSoatEditando(null)} />
      <EditRtmModal isOpen={!!rtmEditando} rtm={rtmEditando} onClose={() => setRtmEditando(null)} />
      <ModalFactory modalType={activeModal} onClose={closeModal} />
    </div>
  );
}

function DocumentTableShell({
  onboardingId,
  icon: Icon,
  title,
  count,
  total,
  searchTerm,
  onSearchChange,
  placeholder,
  children,
  isDarkMode,
}) {
  return (
    // Este shell reutilizable evita duplicar la estructura visual de SOAT y RTM
    // y deja el comportamiento de dark mode centralizado en un solo punto.
    <div data-onboarding={onboardingId} className={`mb-8 overflow-hidden rounded-3xl border shadow-sm ${
      isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'
    }`}>
      <div className={`flex flex-col justify-between gap-4 border-b px-6 py-5 lg:flex-row lg:items-center ${
        isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <Icon className={`w-6 h-6 ${isDarkMode ? 'text-slate-100' : 'text-syntix-navy'}`} />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-syntix-navy'}`}>
            {title} ({count}/{total})
          </h2>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-lg border py-2 pl-9 pr-4 text-sm outline-none focus:border-syntix-blue focus:ring-2 focus:ring-syntix-blue ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function EmptyRows({ colSpan, hasData, isDarkMode }) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-6 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        {hasData ? 'No se encontraron registros con ese criterio.' : 'No hay registros para mostrar.'}
      </td>
    </tr>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="btn-icon text-syntix-blue"
        title="Editar"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="btn-icon text-syntix-red hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function DocumentMobileCard({ type, plate, code, entity, expiration, status, onEdit, onDelete, isDarkMode }) {
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">{type}</p><p className={`mt-1 text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{plate}</p></div>
        <StatusBadge status={status} />
      </div>
      <dl className={`mt-4 grid grid-cols-1 gap-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        <div><dt className="text-xs font-bold uppercase text-slate-400">Documento</dt><dd className="mt-1 break-words font-semibold">{code}</dd></div>
        <div><dt className="text-xs font-bold uppercase text-slate-400">Entidad</dt><dd className="mt-1 break-words">{entity || 'Sin dato'}</dd></div>
        <div><dt className="text-xs font-bold uppercase text-slate-400">Vencimiento</dt><dd className="mt-1">{formatColombianDate(expiration)}</dd></div>
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onEdit} className="btn-secondary min-h-10">Editar</button>
        <button type="button" onClick={onDelete} className="btn-danger min-h-10">Eliminar</button>
      </div>
    </article>
  );
}

DocumentTableShell.propTypes = {
  onboardingId: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

EmptyRows.propTypes = {
  colSpan: PropTypes.number.isRequired,
  hasData: PropTypes.bool.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

RowActions.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

DocumentMobileCard.propTypes = {
  type: PropTypes.string.isRequired,
  plate: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  entity: PropTypes.string,
  expiration: PropTypes.string,
  status: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};
