import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Plus, Trash2, Car } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import AddVehicleModal from '@/components/AddVehicleModal.jsx';
import { useOnboarding } from '@/contexts/OnboardingContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useVehicles } from '@/hooks/useVehicles.js';
import { getVehicleStatusSummary } from '@/utils/dateUtils.js';
import { ConfirmDialog } from '@/components/UI/SaasUI.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

const VISIBLE_STATUS_REASONS = 3;

// Vista principal de flota: combina búsqueda, filtros y edición sobre los vehículos del usuario.
export default function VehiculosPage() {
  const { vehiculos, deleteVehicle } = useVehicles();
  const { currentStep, isTourActive } = useOnboarding();
  const { isDarkMode } = useTheme();
  const toast = useToast();
  const tutorialOpenedModalRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('todos');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreateModal = () => {
    setVehicleToEdit(null);
    setIsVehicleModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setVehicleToEdit(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsVehicleModalOpen(false);
    setVehicleToEdit(null);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    setDeleting(true);
    try {
      await deleteVehicle(vehicleToDelete.id);
      toast.success('Vehículo eliminado correctamente.');
      setVehicleToDelete(null);
    } catch {
      toast.error('No pudimos eliminar el vehículo. Intenta nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  // El filtrado une texto libre y severidad para apoyar tanto búsqueda rápida como revisión operativa.
  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter((v) => {
      const matchesSearch = [v.placa, v.marca, v.modelo, v.tipo, v.ownerLabel]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesState = filterState === 'todos' || v.estadoGeneral === filterState;
      return matchesSearch && matchesState;
    });
  }, [vehiculos, searchTerm, filterState]);

  useEffect(() => {
    // Durante el onboarding el modal se fuerza abierto cuando el paso actual
    // necesita explicar el formulario de vehículo en contexto real.
    const vehicleTutorialSteps = new Set([
      'vehicle-form',
      'vehicle-plate-field',
      'vehicle-brand-model-fields',
      'vehicle-year-type-fields',
      'vehicle-submit-actions',
    ]);

    const shouldShowTutorialModal = Boolean(
      isTourActive && vehicleTutorialSteps.has(currentStep?.id)
    );

    if (shouldShowTutorialModal) {
      setVehicleToEdit(null);
      setIsVehicleModalOpen(true);
      tutorialOpenedModalRef.current = true;
      return;
    }

    if (tutorialOpenedModalRef.current) {
      setIsVehicleModalOpen(false);
      setVehicleToEdit(null);
      tutorialOpenedModalRef.current = false;
    }
  }, [currentStep?.id, isTourActive]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Vehiculos | SYNTIX Drive Control</title>
      </Helmet>

      <div
        data-onboarding="vehicles-header"
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-syntix-navy'}`}>Gestión de vehículos</h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Consulta, registra y controla el estado documental de los vehículos de tu flota.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          data-onboarding="vehicles-add-button"
          className="bg-syntix-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-syntix-navy/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Agregar vehículo
        </button>
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-sm ${
        isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'
      }`}>
        {/* Buscador y filtro comparten la misma banda superior para que la tabla
            responda rápido sin obligar a cambiar de vista o abrir otro panel. */}
        <div className={`flex flex-col justify-between gap-4 border-b p-4 sm:flex-row ${
          isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-gray-100 bg-gray-50/50'
        }`}>
          <div data-onboarding="vehicles-search" className="relative w-full sm:w-96">
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Buscar por placa, marca, modelo o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-lg border py-2 pl-9 pr-4 text-sm outline-none focus:border-syntix-green focus:ring-2 focus:ring-syntix-green ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>

          <select
            data-onboarding="vehicles-filter"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-syntix-green ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 text-slate-200'
                : 'border-gray-300 bg-white text-gray-700'
            }`}
          >
            <option value="todos">Todos los estados</option>
            <option value="verde">Al d&iacute;a</option>
            <option value="amarillo">Por vencer</option>
            <option value="rojo">Cr&iacute;tico</option>
          </select>
        </div>

        <div data-onboarding="vehicles-table" className="md:hidden p-4 space-y-3">
          {filteredVehiculos.map((v) => {
            const statusSummary = v.estadoRazones
              ? {
                status: v.estadoGeneral,
                reason: v.estadoRazon,
                reasons: v.estadoRazones,
              }
              : getVehicleStatusSummary(v);
            const visibleReasons = statusSummary.reasons?.slice(0, VISIBLE_STATUS_REASONS) || [
              statusSummary.reason,
            ];

            return (
              <article
                key={v.id}
                className={`rounded-xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-gray-100 bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`break-words text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{v.placa}</p>
                    <p className={`break-words text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {v.marca} {v.modelo} · {v.anio}
                    </p>
                  </div>
                  <StatusBadge status={statusSummary.status} />
                </div>

                <dl className={`mt-4 grid grid-cols-1 gap-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide opacity-70">Tipo</dt>
                    <dd className="break-words">{v.tipo}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide opacity-70">Usuario</dt>
                    <dd className="break-words">{v.ownerLabel}</dd>
                    {v.ownerEmail && <dd className="break-all text-xs opacity-70">{v.ownerEmail}</dd>}
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide opacity-70">Conductor</dt>
                    <dd className="break-words">{v.conductor?.nombre || 'Sin asignar'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide opacity-70">Estado</dt>
                    <dd className="mt-1 space-y-1">
                      {visibleReasons.map((reason) => (
                        <span key={reason} className="block break-words text-xs font-semibold">{reason}</span>
                      ))}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openEditModal(v)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isDarkMode
                        ? 'bg-syntix-green/10 text-syntix-green hover:bg-syntix-green/20'
                        : 'bg-syntix-navy/5 text-syntix-navy hover:bg-syntix-navy/10'
                    }`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleToDelete(v)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isDarkMode
                        ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                        : 'bg-red-50 text-syntix-red hover:bg-red-100'
                    }`}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}

          {filteredVehiculos.length === 0 && (
            <div className={`rounded-xl border p-6 text-center ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-500'}`}>
              <Car className="mx-auto mb-3 h-8 w-8 opacity-60" />
              <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>Aun no hay vehiculos para mostrar.</p>
              <p className="mt-1 text-sm">Agrega un vehiculo para comenzar a gestionar la flota.</p>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className={`w-full text-left text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            <thead className={`border-b font-semibold ${
              isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-gray-200 bg-gray-50 text-gray-700'
            }`}>
              <tr>
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Vehiculo</th>
                <th className="px-6 py-4">Usuario asociado</th>
                <th className="px-6 py-4">Conductor asignado</th>
                <th className="px-6 py-4">Estado general</th>
                <th className="px-6 py-4 text-center">Editar</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? 'divide-y divide-slate-800' : 'divide-y divide-gray-100'}>
              {filteredVehiculos.map((v) => {
                const statusSummary = v.estadoRazones
                  ? {
                    status: v.estadoGeneral,
                    reason: v.estadoRazon,
                    reasons: v.estadoRazones,
                  }
                  : getVehicleStatusSummary(v);
                const visibleReasons = statusSummary.reasons?.slice(0, VISIBLE_STATUS_REASONS) || [
                  statusSummary.reason,
                ];
                const hiddenReasonsCount = Math.max(
                  (statusSummary.reasons?.length || visibleReasons.length) - VISIBLE_STATUS_REASONS,
                  0
                );

                return (
                  <tr key={v.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/70' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{v.placa}</td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {v.marca} {v.modelo}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {v.tipo} - {v.anio}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{v.ownerLabel}</div>
                      {v.ownerEmail && <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{v.ownerEmail}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {v.conductor ? (
                        <span className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{v.conductor.nombre}</span>
                      ) : (
                        <span className={`italic ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={statusSummary.status} />
                        <ul className={`mt-0.5 space-y-0.5 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {visibleReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                          {hiddenReasonsCount > 0 && (
                            <li>+{hiddenReasonsCount} m&aacute;s</li>
                          )}
                        </ul>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(v)}
                        className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isDarkMode
                            ? 'bg-syntix-green/10 text-syntix-green hover:bg-syntix-green/20'
                            : 'bg-syntix-navy/5 text-syntix-navy hover:bg-syntix-navy/10'
                        }`}
                        aria-label={`Editar vehiculo ${v.placa}`}
                      >
                        Editar
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setVehicleToDelete(v)}
                        className={`rounded-lg p-2 transition-colors ${
                          isDarkMode
                            ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-300'
                            : 'text-gray-400 hover:bg-red-50 hover:text-syntix-red'
                        }`}
                        aria-label={`Eliminar vehiculo ${v.placa}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredVehiculos.length === 0 && (
                <tr>
                  <td colSpan="7" className={`px-6 py-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <div className="flex flex-col items-center gap-3">
                      <Car className={`w-8 h-8 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>Aun no hay vehiculos para mostrar.</p>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Agrega un vehiculo para comenzar a gestionar la flota.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={handleCloseModal}
        vehicleToEdit={vehicleToEdit}
      />
      <ConfirmDialog
        isOpen={Boolean(vehicleToDelete)}
        title="Eliminar vehículo"
        description={`Vas a eliminar ${vehicleToDelete?.placa || 'este vehículo'} y sus documentos asociados. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setVehicleToDelete(null)}
        busy={deleting}
        destructive
      />
    </div>
  );
}
