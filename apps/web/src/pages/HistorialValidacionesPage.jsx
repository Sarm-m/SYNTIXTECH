import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { AlertTriangle, Search, Download, Eye, Trash2, Calendar } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import DetallesValidacionModal from '@/components/DetallesValidacionModal.jsx';
import { useValidationHistory } from '@/hooks/useValidationHistory.js';
import { ConfirmDialog, EmptyState, MetricCard, PageHeader, SurfaceCard } from '@/components/UI/SaasUI.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';

// HistorialValidacionesPage funciona como bitácora de auditoría para consultas RUNT ya realizadas.
export default function HistorialValidacionesPage() {
  const { validations, deleteValidation, getValidationHistory, exportToCSV, getStatistics } = useValidationHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('todos');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationToDelete, setValidationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const { isDarkMode } = useTheme();

  const itemsPerPage = 20;

  // Los filtros se aplican antes de paginar para que la navegación siempre refleje el subconjunto activo.
  const filteredValidations = useMemo(() => {
    let filtered = [...validations];

    // Filtro por búsqueda (placa)
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.placa.includes(searchTerm.toUpperCase())
      );
    }

    // Filtro por estado
    if (filterState !== 'todos') {
      filtered = filtered.filter(v => {
        const soatVigente = v.resultadoRUNT?.data?.soat?.vigente;
        const rtmVigente = v.resultadoRUNT?.data?.rtm?.vigente;

        if (filterState === 'vigentes') return soatVigente && rtmVigente;
        if (filterState === 'alertas') return !soatVigente || !rtmVigente;
        if (filterState === 'vencidos') return !soatVigente || !rtmVigente;
      });
    }

    // Filtro por rango de fechas
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start).getTime();
      const end = new Date(dateRange.end).getTime();

      filtered = filtered.filter(v => {
        const timestamp = new Date(v.timestamp).getTime();
        return timestamp >= start && timestamp <= end;
      });
    }

    return filtered;
  }, [validations, searchTerm, filterState, dateRange]);

  // La paginación mantiene liviana la tabla aunque el historial siga creciendo.
  const totalPages = Math.ceil(filteredValidations.length / itemsPerPage);
  const paginatedValidations = filteredValidations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = useMemo(() => getStatistics(), [validations]);

  const handleViewDetails = (validation) => {
    setSelectedValidation(validation);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setValidationToDelete(validations.find((validation) => validation.id === id) || { id });
  };

  const handleDeleteConfirm = async () => {
    if (!validationToDelete) return;
    setDeleting(true);
    try {
      await deleteValidation(validationToDelete.id);
      toast.success('Validación eliminada correctamente.');
      setValidationToDelete(null);
      setIsModalOpen(false);
    } catch {
      toast.error('No pudimos eliminar la validación. Intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadCSV = () => {
    const csv = exportToCSV();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `historial-validaciones-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Historial de Validaciones | SYNTIX Drive Control</title>
      </Helmet>

      <div data-onboarding="runt-history-header">
        <PageHeader
          eyebrow="Auditoría RUNT"
          title="Historial de Validaciones RUNT"
          description="Consulta evidencias, filtra resultados y exporta el historial operativo de validaciones."
          actions={(
            <button
              data-onboarding="runt-history-export"
              onClick={handleDownloadCSV}
              disabled={filteredValidations.length === 0}
              className="btn-primary"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          )}
        />
      </div>

      {/* Estadísticas */}
      <div data-onboarding="runt-history-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Search} label="Total" value={stats.total} hint="validaciones" />
        <MetricCard icon={Calendar} label="Esta semana" value={stats.thisWeek} hint="consultadas" tone="blue" />
        <MetricCard icon={AlertTriangle} label="Con alertas" value={stats.withVencimientos} hint="vencidas" tone="red" />
        <MetricCard icon={Eye} label="Cumplimiento" value={`${stats.compliancePercentage}%`} hint="vigentes" tone="green" />
      </div>

      {/* Filtros */}
      <SurfaceCard data-onboarding="runt-history-filters" className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="field-control pl-9"
            />
          </div>

          {/* Filtro Estado */}
          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setCurrentPage(1);
            }}
            className="field-control font-medium"
          >
            <option value="todos">Todos los estados</option>
            <option value="vigentes">Al d&iacute;a</option>
            <option value="alertas">Con Alertas</option>
            <option value="vencidos">Cr&iacute;tico</option>
          </select>

          {/* Fecha Inicio */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange({ ...dateRange, start: e.target.value });
                setCurrentPage(1);
              }}
              className="field-control pl-9"
            />
          </div>

          {/* Fecha Fin */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange({ ...dateRange, end: e.target.value });
                setCurrentPage(1);
              }}
              className="field-control pl-9"
            />
          </div>
        </div>
      </SurfaceCard>

      {/* Tabla */}
      <SurfaceCard data-onboarding="runt-history-table" className="overflow-hidden">
        {filteredValidations.length === 0 ? (
          <div className="p-4 sm:p-8">
            <EmptyState
              icon={Search}
              title="No hay validaciones registradas todavía"
              description="Consulta una placa en el módulo RUNT para guardar evidencia y construir el historial."
              actionLabel="Ir a validación RUNT"
              actionTo="/validacion-runt"
              compact
            />
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paginatedValidations.map((validation) => {
                const soatState = validation.resultadoRUNT?.data?.soat?.vigente ? 'verde' : 'rojo';
                const rtmState = validation.resultadoRUNT?.data?.rtm?.vigente ? 'verde' : 'rojo';
                return (
                  <article key={validation.id} className={`rounded-xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className={`text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-syntix-navy'}`}>{validation.placa}</p><p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{new Date(validation.timestamp).toLocaleString('es-CO')}</p></div><button type="button" onClick={() => handleViewDetails(validation)} className="btn-icon text-syntix-blue" aria-label={`Ver detalles ${validation.placa}`}><Eye className="h-4 w-4" /></button></div>
                    <div className="mt-4 flex gap-3"><span className="text-xs font-bold text-gray-500">SOAT</span><StatusBadge status={soatState} /><span className="ml-2 text-xs font-bold text-gray-500">RTM</span><StatusBadge status={rtmState} /></div>
                    <button type="button" onClick={() => handleDelete(validation.id)} className="btn-danger mt-4 w-full">Eliminar validación</button>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className={`w-full text-left text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                <thead className={`border-b font-semibold ${isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                  <tr>
                    <th className="px-6 py-4">Placa</th>
                    <th className="px-6 py-4">Fecha/Hora</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4 text-center">SOAT</th>
                    <th className="px-6 py-4 text-center">RTM</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className={isDarkMode ? 'divide-y divide-slate-800' : 'divide-y divide-gray-100'}>
                  {paginatedValidations.map((validation) => {
                    const soatVigente = validation.resultadoRUNT?.data?.soat?.vigente;
                    const rtmVigente = validation.resultadoRUNT?.data?.rtm?.vigente;
                    const soatState = soatVigente ? 'verde' : 'rojo';
                    const rtmState = rtmVigente ? 'verde' : 'rojo';

                    return (
                      <tr key={validation.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/70' : 'hover:bg-gray-50'}`}>
                        <td className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{validation.placa}</td>
                        <td className="px-6 py-4 text-xs">
                          {new Date(validation.timestamp).toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-sm">{validation.usuario}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={soatState} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={rtmState} />
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleViewDetails(validation)}
                            className="btn-icon text-syntix-blue"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(validation.id)}
                            className="btn-icon text-syntix-red hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between border-t px-6 py-4 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Página {currentPage} de {totalPages}
                </p>
                <div className="space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary min-h-9 px-3 py-1 text-xs"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary min-h-9 px-3 py-1 text-xs"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SurfaceCard>

      {/* Modal Detalles */}
      {selectedValidation && (
        <DetallesValidacionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          validation={selectedValidation}
          historialPlaca={getValidationHistory(selectedValidation.placa)}
          onDeleteValidation={handleDelete}
          onDownloadPDF={() => toast.info('La exportación PDF estará disponible en una próxima versión.')}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(validationToDelete)}
        title="Eliminar validación"
        description={`Vas a eliminar la validación de ${validationToDelete?.placa || 'esta placa'}. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setValidationToDelete(null)}
        busy={deleting}
        destructive
      />
    </div>
  );
}
