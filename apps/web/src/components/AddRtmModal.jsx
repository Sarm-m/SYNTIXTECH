import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { X, FileText, Save } from 'lucide-react';
import { useRtm } from '@/contexts/RtmContext.jsx';
import { useVehicles } from '@/hooks/useVehicles.js';
import {
  isDateRangeValid,
  isValidDateValue,
  isValidDocumentCode,
  isValidPlate,
  normalizeDocumentCode,
  normalizePlate,
} from '@/utils/colombiaFormats.js';
import { useToast } from '@/contexts/ToastContext.jsx';

const CDAS_DEMO = [
  'CDA Bogota Norte',
  'CDA Movilidad Capital',
  'CDA Andino',
  'CDA Autocontrol',
  'CDA Revision Segura',
  'CDA Centro Diagnostico Vial',
  'CDA Ruta Segura',
  'CDA Tecnica Motor',
];

const RESULTADOS = ['Aprobado', 'Rechazado', 'Pendiente'];

const createInitialFormData = () => ({
  vehiculoId: '',
  numeroCertificado: '',
  cda: '',
  fechaExpedicion: '',
  fechaVencimiento: '',
  resultado: 'Aprobado',
  observaciones: '',
});

export default function AddRtmModal({ isOpen, onClose }) {
  const { vehiculos } = useVehicles();
  const { addRtm } = useRtm();
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

    if (!formData.vehiculoId) {
      setError('Seleccione un vehículo asociado a la RTM.');
      return;
    }

    const placaVehiculo = normalizePlate(selectedVehicle?.placa || '');
    if (!selectedVehicle || !isValidPlate(placaVehiculo)) {
      setError('La placa asociada debe tener formato ABC123.');
      return;
    }

    const numeroCertificado = normalizeDocumentCode(formData.numeroCertificado);
    if (!numeroCertificado) {
      setError('El numero de certificado es obligatorio.');
      return;
    }

    if (!isValidDocumentCode(numeroCertificado)) {
      setError('El numero de certificado debe ser alfanumerico y tener entre 6 y 30 caracteres.');
      return;
    }

    const cda = formData.cda.trim();
    if (!cda) {
      setError('El CDA es obligatorio.');
      return;
    }

    if (!isValidDateValue(formData.fechaExpedicion) || !isValidDateValue(formData.fechaVencimiento)) {
      setError('Seleccione fechas válidas para la RTM.');
      return;
    }

    if (!isDateRangeValid(formData.fechaExpedicion, formData.fechaVencimiento)) {
      setError('La fecha de vencimiento no puede ser anterior a la fecha de expedición.');
      return;
    }

    try {
      setSaving(true);
      await addRtm({
        vehiculoId: formData.vehiculoId,
        placaVehiculo,
        numeroCertificado,
        cda,
        fechaExpedicion: formData.fechaExpedicion,
        fechaVencimiento: formData.fechaVencimiento,
        resultado: formData.resultado,
        observaciones: formData.observaciones.trim(),
      });
      toast.success('RTM registrada correctamente.');
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la RTM. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="document-modal max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-syntix-navy flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Agregar RTM
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
            <label htmlFor="rtm-vehiculo" className="block text-sm font-bold text-gray-700 mb-1">Vehículo</label>
            <select
              id="rtm-vehiculo"
              required
              value={formData.vehiculoId}
              onChange={(e) => setFormData({ ...formData, vehiculoId: e.target.value })}
              className="field-control"
            >
              <option value="">Selecciona un vehiculo</option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.placa} · {vehiculo.tipo || 'Otro'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rtm-numero-certificado" className="block text-sm font-bold text-gray-700 mb-1">Número de certificado RTM</label>
              <input
                id="rtm-numero-certificado"
                type="text"
                required
                value={formData.numeroCertificado}
                onChange={(e) => setFormData({ ...formData, numeroCertificado: e.target.value.toUpperCase() })}
                className="field-control uppercase"
                placeholder="RTM20260001"
              />
            </div>
            <div>
              <label htmlFor="rtm-cda" className="block text-sm font-bold text-gray-700 mb-1">CDA</label>
              <input
                id="rtm-cda"
                list="cdas-rtm"
                required
                value={formData.cda}
                onChange={(e) => setFormData({ ...formData, cda: e.target.value })}
                className="field-control"
                placeholder="CDA Bogota Norte"
              />
              <datalist id="cdas-rtm">
                {CDAS_DEMO.map((cda) => (
                  <option key={cda} value={cda} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="rtm-fecha-expedicion" className="block text-sm font-bold text-gray-700 mb-1">Fecha de expedición</label>
              <input
                id="rtm-fecha-expedicion"
                type="date"
                required
                value={formData.fechaExpedicion}
                onChange={(e) => setFormData({ ...formData, fechaExpedicion: e.target.value })}
                className="field-control"
              />
            </div>
            <div>
              <label htmlFor="rtm-fecha-vencimiento" className="block text-sm font-bold text-gray-700 mb-1">Fecha vencimiento</label>
              <input
                id="rtm-fecha-vencimiento"
                type="date"
                required
                value={formData.fechaVencimiento}
                onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                className="field-control"
              />
            </div>
            <div>
              <label htmlFor="rtm-resultado" className="block text-sm font-bold text-gray-700 mb-1">Resultado</label>
              <select
                id="rtm-resultado"
                value={formData.resultado}
                onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                className="field-control"
              >
                {RESULTADOS.map((resultado) => (
                  <option key={resultado} value={resultado}>{resultado}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rtm-observaciones" className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
            <textarea
              id="rtm-observaciones"
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
              {saving ? 'Guardando...' : 'Registrar RTM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddRtmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
