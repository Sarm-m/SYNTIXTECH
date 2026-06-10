import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Car, Save } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles.js';
import { isValidPlate, normalizePlate, sanitizePlate } from '@/utils/colombiaFormats.js';
import { useToast } from '@/contexts/ToastContext.jsx';

const VEHICLE_TYPE_OPTIONS = [
  'Automovil',
  'Camioneta',
  'Pickup',
  'Van',
  'Van de soporte',
  'Camion liviano',
  'Camion mediano',
  'Camion de carga',
  'Camion refrigerado',
  'Buseta',
  'Microbus',
  'Otro',
];

const createInitialFormData = (currentYear) => ({
  placa: '',
  marca: '',
  modelo: '',
  anio: currentYear,
  tipo: 'Automovil',
});

// Este modal reutiliza la misma UI para crear y editar vehículos.
// Además centraliza las validaciones que impactan el inventario base de la flota.
export default function AddVehicleModal({ isOpen, onClose, vehicleToEdit = null }) {
  const { vehiculos, addVehicle, updateVehicle } = useVehicles();
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState(() => createInitialFormData(currentYear));
  const [error, setError] = useState('');

  const isEditing = Boolean(vehicleToEdit?.id);
  const modalTitle = isEditing ? 'Editar vehículo' : 'Agregar vehículo';
  const submitLabel = isEditing ? 'Actualizar' : 'Guardar';

  const resetForm = () => {
    setFormData(createInitialFormData(currentYear));
    setError('');
  };

  useEffect(() => {
    // Cuando el modal cambia de modo, el formulario se sincroniza con el vehículo activo
    // o vuelve a un estado limpio para una creación nueva.
    if (!isOpen) {
      return;
    }

    if (isEditing) {
      setFormData({
        placa: vehicleToEdit.placa ?? '',
        marca: vehicleToEdit.marca ?? '',
        modelo: vehicleToEdit.modelo ?? '',
        anio: vehicleToEdit.anio ?? currentYear,
        tipo: vehicleToEdit.tipo ?? 'Automovil',
      });
      setError('');
      return;
    }

    setFormData(createInitialFormData(currentYear));
    setError('');
  }, [currentYear, isEditing, isOpen, vehicleToEdit]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const placaNormalizada = normalizePlate(formData.placa);
    const marca = formData.marca.trim();
    const modelo = formData.modelo.trim();
    const tipo = String(formData.tipo ?? '').trim();
    const anio = Number(formData.anio);

    if (!placaNormalizada || !marca || !modelo || !tipo) {
      setError('Todos los campos obligatorios deben estar completos.');
      return;
    }

    if (!isValidPlate(placaNormalizada)) {
      setError('La placa debe tener formato ABC123: tres letras y tres numeros, sin guiones ni espacios.');
      return;
    }

    if (!Number.isInteger(anio) || anio < 1990 || anio > currentYear + 1) {
      setError('El anio del vehiculo no es valido.');
      return;
    }

    // La placa es el identificador visible más crítico, por eso se protege contra duplicados.
    const isDuplicatePlate = vehiculos.some((vehiculo) => {
      const samePlate = normalizePlate(vehiculo.placa) === placaNormalizada;
      const isSameVehicle = isEditing && String(vehiculo.id) === String(vehicleToEdit.id);
      return samePlate && !isSameVehicle;
    });

    if (isDuplicatePlate) {
      setError('Ya existe un vehiculo con esta placa.');
      return;
    }

    try {
      const payload = {
        ...formData,
        placa: placaNormalizada,
        marca,
        modelo,
        tipo,
        anio,
      };

      if (isEditing) {
        await updateVehicle(vehicleToEdit.id, payload);
        toast.success('Vehículo actualizado correctamente.');
      } else {
        await addVehicle({
          ...payload,
          conductorId: null,
        });
        toast.success('Vehículo creado correctamente.');
      }

      handleClose();
    } catch (err) {
      console.error('Error guardando vehiculo', err);

      if (err.response?.data?.error) {
        setError(err.response.data.error);
        return;
      }

      if (err.response?.data?.message) {
        setError(err.response.data.message);
        return;
      }

      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        setError('El backend no esta disponible. Revisa la terminal donde ejecutaste npm run dev.');
        return;
      }

      setError('No fue posible guardar el vehiculo. Intenta nuevamente.');
    }
  };

  return (
    <div className="safe-area-px safe-area-py fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-sm sm:items-center">
      <div
        data-onboarding="vehicle-form"
        className="flex max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <div className="flex shrink-0 justify-between items-center p-5 border-b border-gray-100 bg-gray-50 sm:p-6">
          <h2 className="text-xl font-bold text-syntix-navy flex items-center gap-2">
            <Car className="w-5 h-5" /> {modalTitle}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="min-h-0 overflow-y-auto p-5 space-y-4 sm:p-6">
          {error && (
            <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div data-onboarding="vehicle-plate-field">
            <label htmlFor="vehicle-plate" className="block text-sm font-bold text-gray-700 mb-1">Placa</label>
            <input
              id="vehicle-plate"
              type="text"
              required
              maxLength={6}
              value={formData.placa}
              onChange={(e) =>
                setFormData({ ...formData, placa: sanitizePlate(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntix-green outline-none text-gray-900 uppercase font-bold tracking-wider"
              placeholder="ABC123"
            />
          </div>

          <div data-onboarding="vehicle-brand-model-fields" className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vehicle-brand" className="block text-sm font-bold text-gray-700 mb-1">Marca</label>
              <input
                id="vehicle-brand"
                type="text"
                required
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntix-green outline-none text-gray-900"
                placeholder="Toyota"
              />
            </div>
            <div>
              <label htmlFor="vehicle-model" className="block text-sm font-bold text-gray-700 mb-1">Modelo</label>
              <input
                id="vehicle-model"
                type="text"
                required
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntix-green outline-none text-gray-900"
                placeholder="Hilux"
              />
            </div>
          </div>

          <div data-onboarding="vehicle-year-type-fields" className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vehicle-year" className="block text-sm font-bold text-gray-700 mb-1">Anio</label>
              <input
                id="vehicle-year"
                type="number"
                required
                min="1990"
                max={currentYear + 1}
                value={formData.anio}
                onChange={(e) =>
                  setFormData({ ...formData, anio: Number.parseInt(e.target.value, 10) || '' })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntix-green outline-none text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="vehicle-type" className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
              <select
                id="vehicle-type"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-syntix-green outline-none text-gray-900 bg-white"
              >
                {formData.tipo && !VEHICLE_TYPE_OPTIONS.includes(formData.tipo) && (
                  <option value={formData.tipo}>{formData.tipo}</option>
                )}
                {VEHICLE_TYPE_OPTIONS.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          <div data-onboarding="vehicle-submit-actions" className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-gray-100 bg-white px-5 pb-1 pt-4 sm:-mx-6 sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-syntix-navy text-white px-6 py-2 rounded-lg font-medium hover:bg-syntix-navy/90 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddVehicleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  vehicleToEdit: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    placa: PropTypes.string,
    marca: PropTypes.string,
    modelo: PropTypes.string,
    anio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tipo: PropTypes.string,
  }),
};
