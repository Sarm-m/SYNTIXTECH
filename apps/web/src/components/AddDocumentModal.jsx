import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { X, FileText, Save } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments.js';
import { useVehicles } from '@/hooks/useVehicles.js';
import { SOAT_INSURERS, validateSoatDocument } from '@/utils/documentForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

const createInitialFormData = () => ({
  vehiculoId: '',
  numeroPoliza: '',
  aseguradora: '',
  fechaExpedicion: '',
  fechaInicioVigencia: '',
  fechaFinVigencia: '',
  observaciones: '',
});

export default function AddDocumentModal({ isOpen, onClose }) {
  const { vehiculos } = useVehicles();
  const { addSoat } = useDocuments();
  const toast = useToast();
  const [formData, setFormData] = useState(createInitialFormData);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedVehicle = useMemo(
    () => vehiculos.find((vehiculo) => String(vehiculo.id) === String(formData.vehiculoId)),
    [formData.vehiculoId, vehiculos]
  );

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData(createInitialFormData());
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = validateSoatDocument({
      formData,
      vehicleId: formData.vehiculoId,
      vehiclePlate: selectedVehicle?.placa,
    });
    if (validation.error) {
      setError(validation.error);
      return;
    }

    try {
      setSaving(true);
      await addSoat(validation.data);

      toast.success('SOAT registrado correctamente.');
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el SOAT. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="document-modal max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)]">
        <div className="document-modal-header flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-syntix-navy flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Agregar SOAT
          </h2>
          <button type="button" onClick={handleClose} className="btn-icon">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-4 sm:p-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="soat-vehiculo" className="block text-sm font-bold text-gray-700 mb-1">Vehículo</label>
            <select
              id="soat-vehiculo"
              required
              value={formData.vehiculoId}
              onChange={(e) => setFormData({ ...formData, vehiculoId: e.target.value })}
              className="field-control"
            >
              <option value="">Selecciona un vehículo</option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.placa} · {vehiculo.tipo || 'Otro'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="soat-numero-poliza" className="block text-sm font-bold text-gray-700 mb-1">Número de póliza</label>
              <input
                id="soat-numero-poliza"
                type="text"
                required
                value={formData.numeroPoliza}
                onChange={(e) => setFormData({ ...formData, numeroPoliza: e.target.value.toUpperCase() })}
                className="field-control uppercase"
                placeholder="SOAT20260001"
              />
            </div>
            <div>
              <label htmlFor="soat-aseguradora" className="block text-sm font-bold text-gray-700 mb-1">Aseguradora</label>
              <input
                id="soat-aseguradora"
                list="aseguradoras-soat"
                required
                value={formData.aseguradora}
                onChange={(e) => setFormData({ ...formData, aseguradora: e.target.value })}
                className="field-control"
                placeholder="SURA"
              />
              <datalist id="aseguradoras-soat">
                {SOAT_INSURERS.map((aseguradora) => (
                  <option key={aseguradora} value={aseguradora} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="soat-fecha-expedicion" className="block text-sm font-bold text-gray-700 mb-1">Fecha de expedición</label>
              <input
                id="soat-fecha-expedicion"
                type="date"
                required
                value={formData.fechaExpedicion}
                onChange={(e) => setFormData({ ...formData, fechaExpedicion: e.target.value })}
                className="field-control"
              />
            </div>
            <div>
              <label htmlFor="soat-inicio-vigencia" className="block text-sm font-bold text-gray-700 mb-1">Inicio vigencia</label>
              <input
                id="soat-inicio-vigencia"
                type="date"
                required
                value={formData.fechaInicioVigencia}
                onChange={(e) => setFormData({ ...formData, fechaInicioVigencia: e.target.value })}
                className="field-control"
              />
            </div>
            <div>
              <label htmlFor="soat-fin-vigencia" className="block text-sm font-bold text-gray-700 mb-1">Vencimiento</label>
              <input
                id="soat-fin-vigencia"
                type="date"
                required
                value={formData.fechaFinVigencia}
                onChange={(e) => setFormData({ ...formData, fechaFinVigencia: e.target.value })}
                className="field-control"
              />
            </div>
          </div>

          <div>
            <label htmlFor="soat-observaciones" className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
            <textarea
              id="soat-observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="field-control min-h-20"
              placeholder="Opcional"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Registrar SOAT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddDocumentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
