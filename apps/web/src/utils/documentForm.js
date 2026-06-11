import {
  isDateRangeValid,
  isValidDateValue,
  isValidDocumentCode,
  isValidPlate,
  normalizeDocumentCode,
  normalizePlate,
} from '@/utils/colombiaFormats.js';

export const SOAT_INSURERS = [
  'Seguros Mundial',
  'Seguros Bolivar',
  'SURA',
  'Previsora Seguros',
  'Aseguradora Solidaria',
  'Mapfre',
  'Allianz',
  'Liberty Seguros',
];

export const RTM_CENTERS = [
  'CDA Bogota Norte',
  'CDA Movilidad Capital',
  'CDA Andino',
  'CDA Autocontrol',
  'CDA Revision Segura',
  'CDA Centro Diagnostico Vial',
  'CDA Ruta Segura',
  'CDA Tecnica Motor',
];

export const RTM_RESULTS = ['Aprobado', 'Rechazado', 'Pendiente'];

const failure = (error) => ({ error, data: null });
const success = (data) => ({ error: '', data });

export const validateSoatDocument = ({ formData, vehicleId, vehiclePlate }) => {
  if (!vehicleId) return failure('Seleccione un vehiculo asociado al SOAT.');

  const placaVehiculo = normalizePlate(vehiclePlate);
  if (!isValidPlate(placaVehiculo)) {
    return failure('La placa asociada debe tener formato ABC123.');
  }

  const numeroPoliza = normalizeDocumentCode(formData.numeroPoliza);
  if (!numeroPoliza) return failure('El numero de poliza es obligatorio.');
  if (!isValidDocumentCode(numeroPoliza)) {
    return failure('El numero de poliza debe ser alfanumerico y tener entre 6 y 30 caracteres.');
  }

  const aseguradora = formData.aseguradora.trim();
  if (!aseguradora) return failure('Seleccione una aseguradora.');
  if (!isValidDateValue(formData.fechaExpedicion)) {
    return failure('Seleccione una fecha de expedicion valida.');
  }
  if (!isValidDateValue(formData.fechaInicioVigencia) || !isValidDateValue(formData.fechaFinVigencia)) {
    return failure('Seleccione fechas de vigencia validas.');
  }
  if (!isDateRangeValid(formData.fechaInicioVigencia, formData.fechaFinVigencia)) {
    return failure('La fecha fin de vigencia no puede ser anterior a la fecha de inicio.');
  }

  return success({
    vehiculoId: vehicleId,
    placaVehiculo,
    numeroPoliza,
    aseguradora,
    fechaExpedicion: formData.fechaExpedicion,
    fechaInicioVigencia: formData.fechaInicioVigencia,
    fechaFinVigencia: formData.fechaFinVigencia,
    observaciones: formData.observaciones.trim(),
  });
};

export const validateRtmDocument = ({ formData, vehicleId, vehiclePlate }) => {
  if (!vehicleId) return failure('Seleccione un vehiculo asociado a la RTM.');

  const placaVehiculo = normalizePlate(vehiclePlate);
  if (!isValidPlate(placaVehiculo)) {
    return failure('La placa asociada debe tener formato ABC123.');
  }

  const numeroCertificado = normalizeDocumentCode(formData.numeroCertificado);
  if (!numeroCertificado) return failure('El numero de certificado es obligatorio.');
  if (!isValidDocumentCode(numeroCertificado)) {
    return failure('El numero de certificado debe ser alfanumerico y tener entre 6 y 30 caracteres.');
  }

  const cda = formData.cda.trim();
  if (!cda) return failure('El CDA es obligatorio.');
  if (!isValidDateValue(formData.fechaExpedicion) || !isValidDateValue(formData.fechaVencimiento)) {
    return failure('Seleccione fechas validas para la RTM.');
  }
  if (!isDateRangeValid(formData.fechaExpedicion, formData.fechaVencimiento)) {
    return failure('La fecha de vencimiento no puede ser anterior a la fecha de expedicion.');
  }

  return success({
    vehiculoId: vehicleId,
    placaVehiculo,
    numeroCertificado,
    cda,
    fechaExpedicion: formData.fechaExpedicion,
    fechaVencimiento: formData.fechaVencimiento,
    resultado: formData.resultado,
    observaciones: formData.observaciones.trim(),
  });
};
