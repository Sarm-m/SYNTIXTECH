import api from '@/services/api.js';
import {
  normalizePlate,
  isValidPlate,
  isValidDateValue,
  isValidCedula,
  isValidColombianMobile,
  isValidDocumentCode,
  isDateRangeValid,
} from '@/utils/colombiaFormats.js';

export const BACKUP_VERSION = '1.0';
export const MAX_BACKUP_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_RECORDS_PER_ENTITY = 500;
export const MAX_DOCUMENT_RECORDS_PER_ENTITY = 1000;

export const ENTITY_RECORD_LIMITS = {
  vehiculos: MAX_RECORDS_PER_ENTITY,
  conductores: MAX_RECORDS_PER_ENTITY,
  soats: MAX_DOCUMENT_RECORDS_PER_ENTITY,
  rtms: MAX_DOCUMENT_RECORDS_PER_ENTITY,
  validaciones: MAX_DOCUMENT_RECORDS_PER_ENTITY,
};

export const BACKUP_ENTITY_KEYS = ['vehiculos', 'conductores', 'soats', 'rtms', 'validaciones'];
export const EXCEL_SHEET_NAMES = {
  vehiculos: 'Vehiculos',
  conductores: 'Conductores',
  soats: 'SOAT',
  rtms: 'RTM',
  validaciones: 'Validaciones',
  preferences: 'Preferencias',
  instructions: 'Instrucciones',
};

const BACKUP_NOTES = 'Las alertas no se exportan: se calculan automaticamente a partir de vencimientos.';

const EXCEL_COLUMNS = {
  [EXCEL_SHEET_NAMES.vehiculos]: ['placa', 'marca', 'modelo', 'anio', 'tipo', 'conductorDocumento'],
  [EXCEL_SHEET_NAMES.conductores]: ['nombre', 'documento', 'telefono', 'categoria', 'fechaVencimiento'],
  [EXCEL_SHEET_NAMES.soats]: [
    'placa',
    'numeroPoliza',
    'aseguradora',
    'fechaExpedicion',
    'fechaInicioVigencia',
    'fechaFinVigencia',
    'observaciones',
  ],
  [EXCEL_SHEET_NAMES.rtms]: [
    'placa',
    'numeroCertificado',
    'cda',
    'nitCda',
    'fechaExpedicion',
    'fechaVencimiento',
    'resultado',
    'observaciones',
  ],
  [EXCEL_SHEET_NAMES.validaciones]: ['placa', 'tipo', 'estado', 'fecha', 'observaciones'],
  [EXCEL_SHEET_NAMES.preferences]: ['clave', 'valor'],
  [EXCEL_SHEET_NAMES.instructions]: ['tema', 'detalle'],
};

const EXCEL_HEADER_ALIASES = {
  cedula: 'documento',
  numerodocumento: 'documento',
  documentoidentidad: 'documento',
  nombrecompleto: 'nombre',
  celular: 'telefono',
  telefono: 'telefono',
  licencia: 'categoria',
  categorialicencia: 'categoria',
  fechavencimientolicencia: 'fechaVencimiento',
  placavehiculo: 'placa',
  vehiculoplaca: 'placa',
  poliza: 'numeroPoliza',
  numerosoat: 'numeroPoliza',
  numerortm: 'numeroCertificado',
  certificado: 'numeroCertificado',
  fechatecnomecanica: 'fechaVencimiento',
};

const SENSITIVE_FIELD_NAMES = new Set([
  'password',
  'token',
  'jwt',
  'secret',
  'clientsecret',
  'emailpass',
  'twilioauthtoken',
  'mongouri',
  'jwtsecret',
  'env',
  'refreshToken',
  'accessToken',
].map((fieldName) => fieldName.toLowerCase()));

const OWNERSHIP_FIELD_NAMES = new Set(['owneremail', 'ownerempresa']);

const PREFERENCE_KEYS = [
  'syntix_threshold',
  'syntix_simulated_date',
  'syntix_dark_mode',
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const EXCEL_DATE_EPOCH_MS = Date.UTC(1899, 11, 30);
const MIN_EXCEL_DATE_SERIAL = 20_000;
const MAX_EXCEL_DATE_SERIAL = 80_000;

const RTM_RESULTADOS = new Set(['Aprobado', 'Rechazado', 'Pendiente']);
const RTM_RESULT_ALIASES = {
  aprobado: 'Aprobado',
  aprobada: 'Aprobado',
  rechazado: 'Rechazado',
  rechazada: 'Rechazado',
  pendiente: 'Pendiente',
  pendienteseguimiento: 'Pendiente',
  requiereseguimiento: 'Pendiente',
  requiereverificacion: 'Pendiente',
  seguimiento: 'Pendiente',
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeFieldName = (fieldName) =>
  String(fieldName ?? '')
    .trim()
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const isSensitiveFieldName = (fieldName) => {
  const normalizedName = normalizeFieldName(fieldName);

  return (
    SENSITIVE_FIELD_NAMES.has(normalizedName) ||
    normalizedName.endsWith('token') ||
    normalizedName.endsWith('secret') ||
    normalizedName.includes('password')
  );
};

const isOwnershipFieldName = (fieldName) =>
  OWNERSHIP_FIELD_NAMES.has(normalizeFieldName(fieldName));

const normalizeTextValue = (value) => String(value ?? '').trim();

const normalizeSearchText = (value) =>
  normalizeTextValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const normalizeDriverDocument = (value) =>
  normalizeTextValue(value).replace(/\D/g, '');

const normalizePhoneNumber = (value) => {
  const digits = normalizeTextValue(value).replace(/\D/g, '');
  return digits.replace(/^57(?=3\d{9})/, '');
};

const isExcelDateSerial = (value) =>
  Number.isFinite(value) &&
  value >= MIN_EXCEL_DATE_SERIAL &&
  value <= MAX_EXCEL_DATE_SERIAL;

const excelSerialToDateText = (serial) => {
  const date = new Date(EXCEL_DATE_EPOCH_MS + Math.floor(serial) * DAY_IN_MS);
  return date.toISOString().split('T')[0];
};

const normalizeDateText = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number' && isExcelDateSerial(value)) {
    return excelSerialToDateText(value);
  }

  const text = normalizeTextValue(value);
  if (!text) return '';

  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);
    if (isExcelDateSerial(serial)) {
      return excelSerialToDateText(serial);
    }
  }

  return text.split('T')[0];
};

const normalizeRtmResult = (value) => {
  const text = normalizeTextValue(value);
  if (!text) return 'Aprobado';
  return RTM_RESULT_ALIASES[normalizeSearchText(text)] || text;
};

const getRtmIssueDate = (rtm) => {
  const explicitDate = normalizeDateText(rtm?.fechaExpedicion || rtm?.fechaInicio);
  if (explicitDate) return explicitDate;

  const expirationDate = normalizeDateText(rtm?.fechaVencimiento);
  if (!isValidDateValue(expirationDate)) return '';

  const [year, month, day] = expirationDate.split('-').map(Number);
  return new Date(Date.UTC(year - 1, month - 1, day)).toISOString().split('T')[0];
};

export const sanitizeBackupPayload = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeBackupPayload);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, fieldValue]) => {
    if (isSensitiveFieldName(key)) {
      return acc;
    }

    if (isOwnershipFieldName(key)) {
      return acc;
    }

    acc[key] = sanitizeBackupPayload(fieldValue);
    return acc;
  }, {});
};

const findSensitiveFieldNames = (value, fields = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => findSensitiveFieldNames(item, fields));
    return fields;
  }

  if (!value || typeof value !== 'object') {
    return fields;
  }

  Object.entries(value).forEach(([key, fieldValue]) => {
    if (isSensitiveFieldName(key)) {
      fields.add(key);
    }
    findSensitiveFieldNames(fieldValue, fields);
  });

  return fields;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const limitRecords = (records, label, errors) => {
  const maxRecords = ENTITY_RECORD_LIMITS[label] || MAX_RECORDS_PER_ENTITY;

  if (records.length > maxRecords) {
    errors.push(`El archivo supera el maximo de ${maxRecords} registros en ${label}.`);
    return records.slice(0, maxRecords);
  }

  return records;
};

const normalizePreferenceValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    return String(value);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
      return String(parsed);
    }
  } catch {
    // Si no es JSON serializado, se conserva como texto plano.
  }

  return trimmed;
};

export const normalizeBackupPreferences = (preferences = {}) => {
  if (!isPlainObject(preferences)) {
    return {};
  }

  return PREFERENCE_KEYS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(preferences, key)) {
      acc[key] = normalizePreferenceValue(preferences[key]);
    }
    return acc;
  }, {});
};

const getRecordId = (record) => String(record?._id || record?.id || '');

const buildRecordMap = (records) =>
  new Map(
    toArray(records)
      .map((record) => [getRecordId(record), record])
      .filter(([id]) => Boolean(id))
  );

const getDocumentPlate = (record, vehicleById = new Map()) => {
  const explicitPlate = record?.placaVehiculo || record?.vehiculoPlaca || record?.placa;
  if (explicitPlate) {
    return normalizePlate(explicitPlate);
  }

  const vehicle = vehicleById.get(String(record?.vehiculoId || record?.vehicleId || ''));
  return vehicle?.placa ? normalizePlate(vehicle.placa) : '';
};

const toExcelDateText = (value) => {
  return normalizeDateText(value);
};

export const exportLocalPreferences = () => {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return {};
  }

  return PREFERENCE_KEYS.reduce((acc, key) => {
    const value = globalThis.localStorage.getItem(key);
    if (value !== null) {
      acc[key] = normalizePreferenceValue(value);
    }
    return acc;
  }, {});
};

const addRecordError = (recordErrors, entity, index, message) => {
  recordErrors.push({
    entity,
    index,
    sheet: EXCEL_SHEET_NAMES[entity] || entity,
    rowNumber: index + 2,
    message,
  });
};

const formatRecordError = (error) =>
  `${error.sheet || error.entity} fila ${error.rowNumber || error.index + 2}: ${error.message}`;

const formatValidationErrors = (validation) => [
  ...validation.errors,
  ...validation.recordErrors.map(formatRecordError),
].join(' ');

const validateRequiredText = (record, fieldName) =>
  String(record?.[fieldName] ?? '').trim().length > 0;

const validateDateField = (record, fieldName, entity, index, recordErrors) => {
  const value = record?.[fieldName];
  if (value === undefined || value === null || value === '') {
    return;
  }

  if (!isValidDateValue(toExcelDateText(value))) {
    addRecordError(recordErrors, entity, index, `${fieldName} debe tener formato YYYY-MM-DD.`);
  }
};

const validateRequiredDateField = (record, fieldName, entity, index, recordErrors) => {
  const value = toExcelDateText(record?.[fieldName]);
  if (!value) {
    addRecordError(recordErrors, entity, index, `${fieldName} es obligatorio.`);
    return;
  }

  if (!isValidDateValue(value)) {
    addRecordError(recordErrors, entity, index, `${fieldName} debe tener formato YYYY-MM-DD.`);
  }
};

const validateBackupRecords = (payload) => {
  const recordErrors = [];
  const normalizedVehiclePlates = new Set();
  const normalizedDriverDocuments = new Set();

  toArray(payload.vehiculos).forEach((vehicle, index) => {
    const placa = normalizePlate(vehicle?.placa || '');
    if (!placa) {
      addRecordError(recordErrors, 'vehiculos', index, 'La placa es obligatoria.');
    } else if (!isValidPlate(placa)) {
      addRecordError(recordErrors, 'vehiculos', index, 'La placa debe tener formato ABC123.');
    } else if (normalizedVehiclePlates.has(placa)) {
      addRecordError(recordErrors, 'vehiculos', index, `La placa ${placa} esta duplicada.`);
    } else {
      normalizedVehiclePlates.add(placa);
    }

    if (vehicle?.anio !== undefined && vehicle?.anio !== '' && Number.isNaN(Number(vehicle.anio))) {
      addRecordError(recordErrors, 'vehiculos', index, 'El anio debe ser numerico.');
    }
  });

  toArray(payload.conductores).forEach((driver, index) => {
    const documento = normalizeDriverDocument(driver?.documento);
    const telefono = normalizePhoneNumber(driver?.telefono);
    if (!validateRequiredText(driver, 'nombre')) {
      addRecordError(recordErrors, 'conductores', index, 'El nombre es obligatorio.');
    }
    if (!documento) {
      addRecordError(recordErrors, 'conductores', index, 'El documento es obligatorio.');
    } else if (!isValidCedula(documento)) {
      addRecordError(recordErrors, 'conductores', index, 'La cedula debe tener exactamente 10 digitos numericos.');
    } else if (normalizedDriverDocuments.has(documento)) {
      addRecordError(recordErrors, 'conductores', index, `El documento ${documento} esta duplicado.`);
    } else {
      normalizedDriverDocuments.add(documento);
    }
    if (!telefono) {
      addRecordError(recordErrors, 'conductores', index, 'El telefono es obligatorio.');
    } else if (!isValidColombianMobile(telefono)) {
      addRecordError(recordErrors, 'conductores', index, 'El celular debe tener 10 digitos e iniciar por 3.');
    }
    if (!validateRequiredText(driver, 'categoria')) {
      addRecordError(recordErrors, 'conductores', index, 'La categoria es obligatoria.');
    }
    validateRequiredDateField(driver, 'fechaVencimiento', 'conductores', index, recordErrors);
  });

  toArray(payload.soats).forEach((soat, index) => {
    const placa = normalizePlate(soat?.placaVehiculo || soat?.vehiculoPlaca || soat?.placa || '');
    if (!placa) {
      addRecordError(recordErrors, 'soats', index, 'La placa del SOAT es obligatoria.');
    } else if (!normalizedVehiclePlates.has(placa)) {
      addRecordError(recordErrors, 'soats', index, `La placa ${placa} no existe en Vehiculos.`);
    }
    if (!validateRequiredText(soat, 'numeroPoliza')) {
      addRecordError(recordErrors, 'soats', index, 'El numeroPoliza es obligatorio.');
    }
    validateDateField(soat, 'fechaInicioVigencia', 'soats', index, recordErrors);
    validateDateField(soat, 'fechaFinVigencia', 'soats', index, recordErrors);
  });

  toArray(payload.rtms).forEach((rtm, index) => {
    const placa = normalizePlate(rtm?.placaVehiculo || rtm?.vehiculoPlaca || rtm?.placa || '');
    const resultado = normalizeRtmResult(rtm?.resultado);
    if (!placa) {
      addRecordError(recordErrors, 'rtms', index, 'La placa de la RTM es obligatoria.');
    } else if (!normalizedVehiclePlates.has(placa)) {
      addRecordError(recordErrors, 'rtms', index, `La placa ${placa} no existe en Vehiculos.`);
    }
    if (!validateRequiredText(rtm, 'numeroCertificado')) {
      addRecordError(recordErrors, 'rtms', index, 'El numeroCertificado es obligatorio.');
    } else if (!isValidDocumentCode(rtm.numeroCertificado)) {
      addRecordError(recordErrors, 'rtms', index, 'El numeroCertificado debe ser alfanumerico y tener entre 6 y 30 caracteres.');
    }
    validateRequiredDateField(rtm, 'fechaExpedicion', 'rtms', index, recordErrors);
    validateRequiredDateField(rtm, 'fechaVencimiento', 'rtms', index, recordErrors);
    if (
      isValidDateValue(rtm?.fechaExpedicion) &&
      isValidDateValue(rtm?.fechaVencimiento) &&
      !isDateRangeValid(rtm.fechaExpedicion, rtm.fechaVencimiento)
    ) {
      addRecordError(recordErrors, 'rtms', index, 'La fecha de vencimiento no puede ser anterior a la fecha de expedicion.');
    }
    if (!RTM_RESULTADOS.has(resultado)) {
      addRecordError(recordErrors, 'rtms', index, `El resultado ${rtm?.resultado || '(vacio)'} no es reconocido.`);
    }
  });

  toArray(payload.validaciones).forEach((validation, index) => {
    validateDateField(validation, 'fecha', 'validaciones', index, recordErrors);
  });

  return recordErrors;
};

export const validateBackupPayload = (payload) => {
  const errors = [];
  const warnings = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      errors: ['El archivo no es un objeto JSON valido.'],
      warnings,
      recordErrors: [],
    };
  }

  if (findSensitiveFieldNames(payload).size > 0) {
    errors.push('El archivo contiene campos sensibles no permitidos.');
  }

  const version = String(payload.version || '').trim();
  if (!version) {
    errors.push('Falta el campo version en el respaldo.');
  }

  BACKUP_ENTITY_KEYS.forEach((key) => {
    if (payload[key] !== undefined && !Array.isArray(payload[key])) {
      errors.push(`La seccion ${key} debe ser un arreglo.`);
    }
  });

  const hasEntities = BACKUP_ENTITY_KEYS.some((key) => toArray(payload[key]).length > 0);
  const hasValidPreferencesSection =
    payload.preferences &&
    typeof payload.preferences === 'object' &&
    !Array.isArray(payload.preferences);
  const hasPreferences =
    hasValidPreferencesSection &&
    Object.keys(payload.preferences).length > 0;

  if (payload.preferences !== undefined && !hasValidPreferencesSection) {
    errors.push('La seccion preferences debe ser un objeto con preferencias validas.');
  }

  if (!hasEntities && !hasPreferences) {
    errors.push('El respaldo no contiene datos operativos ni preferencias.');
  }

  BACKUP_ENTITY_KEYS.forEach((key) => {
    const records = toArray(payload[key]);
    const maxRecords = ENTITY_RECORD_LIMITS[key] || MAX_RECORDS_PER_ENTITY;
    if (records.length > maxRecords) {
      errors.push(`Demasiados registros en ${key} (maximo ${maxRecords}).`);
    }
  });

  const recordErrors = validateBackupRecords(normalizeBackupPayload(payload));
  if (recordErrors.length > 0) {
    errors.push(`El respaldo contiene ${recordErrors.length} errores de datos.`);
  }

  if (findSensitiveFieldNames(payload.preferences || {}).size > 0) {
    warnings.push('Las preferencias sensibles fueron bloqueadas.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recordErrors,
  };
};

export const buildBackupFileName = (date = new Date(), extension = 'json') => {
  const dateStr = date.toISOString().split('T')[0];
  return `drive-control-backup-${dateStr}.${extension}`;
};

export const buildBackupPayload = ({
  vehiculos = [],
  conductores = [],
  soats = [],
  rtms = [],
  validaciones = [],
  preferences = {},
  exportedAt = new Date().toISOString(),
} = {}) => {
  const sanitizedConductores = toArray(conductores).map(sanitizeBackupPayload);
  const sanitizedVehiculosSource = toArray(vehiculos).map(sanitizeBackupPayload);
  const vehicleById = buildRecordMap(sanitizedVehiculosSource);
  const conductorById = buildRecordMap(sanitizedConductores);

  const normalizedVehiculos = sanitizedVehiculosSource.map((vehiculo) => {
    const conductor = conductorById.get(String(vehiculo.conductorId || ''));

    return {
      placa: normalizePlate(vehiculo.placa || ''),
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      tipo: vehiculo.tipo,
      conductorDocumento: normalizeDriverDocument(vehiculo.conductorDocumento || conductor?.documento) || null,
    };
  });

  return sanitizeBackupPayload({
    version: BACKUP_VERSION,
    exportedAt,
    vehiculos: normalizedVehiculos,
    conductores: sanitizedConductores.map((conductor) => ({
      nombre: conductor.nombre,
      documento: normalizeDriverDocument(conductor.documento),
      telefono: normalizePhoneNumber(conductor.telefono),
      categoria: conductor.categoria,
      fechaVencimiento: toExcelDateText(conductor.fechaVencimiento),
    })),
    soats: toArray(soats).map((soat) => ({
      placaVehiculo: getDocumentPlate(soat, vehicleById),
      numeroPoliza: soat.numeroPoliza,
      aseguradora: soat.aseguradora,
      fechaExpedicion: toExcelDateText(soat.fechaExpedicion || soat.fechaInicioVigencia || soat.fechaInicio),
      fechaInicioVigencia: toExcelDateText(soat.fechaInicioVigencia || soat.fechaInicio),
      fechaFinVigencia: toExcelDateText(soat.fechaFinVigencia || soat.fechaVencimiento),
      observaciones: soat.observaciones || '',
    })),
    rtms: toArray(rtms).map((rtm) => ({
      placaVehiculo: getDocumentPlate(rtm, vehicleById),
      numeroCertificado: normalizeTextValue(rtm.numeroCertificado || rtm.numeroRtm).toUpperCase(),
      cda: normalizeTextValue(rtm.cda) || 'Sin especificar',
      nitCda: normalizeTextValue(rtm.nitCda),
      fechaExpedicion: getRtmIssueDate(rtm),
      fechaVencimiento: toExcelDateText(rtm.fechaVencimiento),
      resultado: normalizeRtmResult(rtm.resultado),
      observaciones: rtm.observaciones || '',
    })),
    validaciones: toArray(validaciones).map(sanitizeBackupPayload),
    preferences: normalizeBackupPreferences(preferences),
    notes: BACKUP_NOTES,
  });
};

export const exportOperationalBackup = async (userEmail) => {
  if (!userEmail) {
    throw new Error('No hay usuario autenticado para exportar.');
  }

  const params = { email: userEmail };
  const [vehiculosRes, conductoresRes, soatsRes, rtmsRes, validacionesRes] = await Promise.all([
    api.get('/vehiculos', { params }),
    api.get('/conductores', { params }),
    api.get('/soats', { params }),
    api.get('/rtms', { params }),
    api.get('/validaciones', { params }),
  ]);

  return buildBackupPayload({
    vehiculos: vehiculosRes.data,
    conductores: conductoresRes.data,
    soats: soatsRes.data,
    rtms: rtmsRes.data,
    validaciones: validacionesRes.data,
    preferences: exportLocalPreferences(),
  });
};

export const normalizeBackupPayload = (payload = {}) => {
  const sanitized = sanitizeBackupPayload(payload);

  return {
    version: String(sanitized.version || BACKUP_VERSION),
    exportedAt: sanitized.exportedAt || new Date().toISOString(),
    vehiculos: toArray(sanitized.vehiculos).map((vehicle) => ({
      placa: normalizePlate(vehicle.placa || ''),
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      anio: vehicle.anio === undefined || vehicle.anio === '' ? '' : Number(vehicle.anio),
      tipo: vehicle.tipo || 'Otro',
      conductorDocumento: normalizeDriverDocument(vehicle.conductorDocumento) || null,
    })),
    conductores: toArray(sanitized.conductores).map((driver) => ({
      nombre: driver.nombre || '',
      documento: normalizeDriverDocument(driver.documento),
      telefono: normalizePhoneNumber(driver.telefono),
      categoria: driver.categoria || '',
      fechaVencimiento: toExcelDateText(driver.fechaVencimiento),
    })),
    soats: toArray(sanitized.soats).map((soat) => ({
      placaVehiculo: normalizePlate(soat.placaVehiculo || soat.vehiculoPlaca || soat.placa || ''),
      numeroPoliza: soat.numeroPoliza || '',
      aseguradora: soat.aseguradora || '',
      fechaExpedicion: toExcelDateText(soat.fechaExpedicion || soat.fechaInicioVigencia || soat.fechaInicio),
      fechaInicioVigencia: toExcelDateText(soat.fechaInicioVigencia || soat.fechaInicio),
      fechaFinVigencia: toExcelDateText(soat.fechaFinVigencia || soat.fechaVencimiento),
      observaciones: soat.observaciones || '',
    })),
    rtms: toArray(sanitized.rtms).map((rtm) => ({
      placaVehiculo: normalizePlate(rtm.placaVehiculo || rtm.vehiculoPlaca || rtm.placa || ''),
      numeroCertificado: normalizeTextValue(rtm.numeroCertificado || rtm.numeroRtm).toUpperCase(),
      cda: normalizeTextValue(rtm.cda) || 'Sin especificar',
      nitCda: normalizeTextValue(rtm.nitCda),
      fechaExpedicion: getRtmIssueDate(rtm),
      fechaVencimiento: toExcelDateText(rtm.fechaVencimiento),
      resultado: normalizeRtmResult(rtm.resultado),
      observaciones: rtm.observaciones || '',
    })),
    validaciones: toArray(sanitized.validaciones).map((validation) => ({
      placa: normalizePlate(validation.placa || validation.placaVehiculo || ''),
      tipo: validation.tipo || validation.type || '',
      estado: validation.estado || validation.status || '',
      fecha: toExcelDateText(validation.fecha || validation.createdAt),
      observaciones: validation.observaciones || validation.detalle || '',
    })),
    preferences: normalizeBackupPreferences(sanitized.preferences),
    notes: sanitized.notes || BACKUP_NOTES,
  };
};

export const serializeJsonBackup = (payload) =>
  JSON.stringify(normalizeBackupPayload(payload), null, 2);

export const parseJsonBackup = (rawText) => {
  try {
    return normalizeBackupPayload(JSON.parse(rawText));
  } catch {
    throw new Error('El archivo JSON esta mal formado.');
  }
};

const buildValidEntityCounts = (normalized, recordErrors) => {
  const invalidByEntity = recordErrors.reduce((acc, error) => {
    if (!acc[error.entity]) {
      acc[error.entity] = new Set();
    }
    acc[error.entity].add(error.index);
    return acc;
  }, {});

  return BACKUP_ENTITY_KEYS.reduce((acc, key) => {
    const invalidCount = invalidByEntity[key]?.size || 0;
    acc[key] = Math.max(0, toArray(normalized[key]).length - invalidCount);
    return acc;
  }, {});
};

export const summarizeBackupPayload = (payload = {}) => {
  const normalized = normalizeBackupPayload(payload);
  const validation = validateBackupPayload(normalized);
  const validCounts = buildValidEntityCounts(normalized, validation.recordErrors);

  return {
    vehiculos: normalized.vehiculos.length,
    conductores: normalized.conductores.length,
    soats: normalized.soats.length,
    rtms: normalized.rtms.length,
    validaciones: normalized.validaciones.length,
    validCounts,
    preferencias: Object.keys(normalized.preferences).length,
    errors: validation.errors,
    warnings: validation.warnings,
    recordErrors: validation.recordErrors,
    valid: validation.valid,
  };
};

export const buildBackupTemplatePayload = () => ({
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  vehiculos: [],
  conductores: [],
  soats: [],
  rtms: [],
  validaciones: [],
  preferences: {
    syntix_threshold: '',
    syntix_simulated_date: '',
    syntix_dark_mode: '',
  },
  notes: BACKUP_NOTES,
});

export const buildSampleBackupPayload = () => buildBackupPayload({
  exportedAt: '2026-05-22T00:00:00.000Z',
  vehiculos: [
    { _id: 'veh-101', placa: 'DCV101', marca: 'Chevrolet', modelo: 'NHR', anio: 2021, tipo: 'Camioneta reparto', conductorId: 'drv-101' },
    { _id: 'veh-102', placa: 'DCV102', marca: 'Toyota', modelo: 'Hilux', anio: 2023, tipo: 'Pickup', conductorId: 'drv-102' },
    { _id: 'veh-103', placa: 'DCV103', marca: 'Hino', modelo: 'Dutro', anio: 2020, tipo: 'Camion liviano', conductorId: 'drv-103' },
    { _id: 'veh-104', placa: 'DCV104', marca: 'Ford', modelo: 'Transit', anio: 2024, tipo: 'Van soporte', conductorId: 'drv-104' },
    { _id: 'veh-105', placa: 'DCV105', marca: 'Isuzu', modelo: 'NPR', anio: 2022, tipo: 'Camion mediano', conductorId: 'drv-105' },
    { _id: 'veh-106', placa: 'DCV106', marca: 'Foton', modelo: 'Aumark', anio: 2021, tipo: 'Carga seca', conductorId: 'drv-106' },
    { _id: 'veh-107', placa: 'DCV107', marca: 'Nissan', modelo: 'Frontier', anio: 2022, tipo: 'Pickup operativa', conductorId: 'drv-107' },
    { _id: 'veh-108', placa: 'DCV108', marca: 'JAC', modelo: 'HFC', anio: 2018, tipo: 'Camion logistico', conductorId: 'drv-108' },
    { _id: 'veh-109', placa: 'DCV109', marca: 'Mercedes-Benz', modelo: 'Sprinter', anio: 2020, tipo: 'Van empresarial', conductorId: 'drv-109' },
    { _id: 'veh-110', placa: 'DCV110', marca: 'Volkswagen', modelo: 'Delivery', anio: 2019, tipo: 'Camion urbano' },
  ],
  conductores: [
    { _id: 'drv-101', nombre: 'Laura Mendez Rojas', documento: '1000000001', telefono: '3001112233', categoria: 'C2', fechaVencimiento: '2025-12-15' },
    { _id: 'drv-102', nombre: 'Carlos Rincon Vega', documento: '1000000002', telefono: '3001112234', categoria: 'C1', fechaVencimiento: '2026-03-02' },
    { _id: 'drv-103', nombre: 'Mariana Torres Gil', documento: '1000000003', telefono: '3001112235', categoria: 'C2', fechaVencimiento: '2026-05-10' },
    { _id: 'drv-104', nombre: 'Andres Salazar Pena', documento: '1000000004', telefono: '3001112236', categoria: 'B1', fechaVencimiento: '2026-05-22' },
    { _id: 'drv-105', nombre: 'Nicolas Gomez Ruiz', documento: '1000000005', telefono: '3001112237', categoria: 'C3', fechaVencimiento: '2026-05-28' },
    { _id: 'drv-106', nombre: 'Paula Cardenas Leon', documento: '1000000006', telefono: '3001112238', categoria: 'C2', fechaVencimiento: '2026-06-01' },
    { _id: 'drv-107', nombre: 'Felipe Duarte Mora', documento: '1000000007', telefono: '3001112239', categoria: 'B1', fechaVencimiento: '2026-06-10' },
    { _id: 'drv-108', nombre: 'Daniela Vargas Solano', documento: '1000000008', telefono: '3001112240', categoria: 'C1', fechaVencimiento: '2026-12-31' },
    { _id: 'drv-109', nombre: 'Santiago Mejia Castro', documento: '1000000009', telefono: '3001112241', categoria: 'C2', fechaVencimiento: '2027-03-15' },
    { _id: 'drv-110', nombre: 'Valeria Pardo Nieto', documento: '1000000010', telefono: '3001112242', categoria: 'B1', fechaVencimiento: '2028-01-20' },
  ],
  soats: [
    { vehiculoId: 'veh-101', numeroPoliza: 'SOAT-DCV101-2026', aseguradora: 'SURA', fechaInicioVigencia: '2024-12-15', fechaFinVigencia: '2025-12-15' },
    { vehiculoId: 'veh-102', numeroPoliza: 'SOAT-DCV102-2026', aseguradora: 'Bolivar', fechaInicioVigencia: '2025-03-02', fechaFinVigencia: '2026-03-02' },
    { vehiculoId: 'veh-103', numeroPoliza: 'SOAT-DCV103-2026', aseguradora: 'Mapfre', fechaInicioVigencia: '2025-05-10', fechaFinVigencia: '2026-05-10' },
    { vehiculoId: 'veh-104', numeroPoliza: 'SOAT-DCV104-2026', aseguradora: 'AXA Colpatria', fechaInicioVigencia: '2025-05-22', fechaFinVigencia: '2026-05-22' },
    { vehiculoId: 'veh-105', numeroPoliza: 'SOAT-DCV105-2026', aseguradora: 'SURA', fechaInicioVigencia: '2025-05-28', fechaFinVigencia: '2026-05-28' },
    { vehiculoId: 'veh-106', numeroPoliza: 'SOAT-DCV106-2026', aseguradora: 'Bolivar', fechaInicioVigencia: '2025-06-01', fechaFinVigencia: '2026-06-01' },
    { vehiculoId: 'veh-107', numeroPoliza: 'SOAT-DCV107-2026', aseguradora: 'Mapfre', fechaInicioVigencia: '2025-06-10', fechaFinVigencia: '2026-06-10' },
    { vehiculoId: 'veh-108', numeroPoliza: 'SOAT-DCV108-2026', aseguradora: 'SURA', fechaInicioVigencia: '2025-12-31', fechaFinVigencia: '2026-12-31' },
    { vehiculoId: 'veh-109', numeroPoliza: 'SOAT-DCV109-2026', aseguradora: 'Bolivar', fechaInicioVigencia: '2026-03-15', fechaFinVigencia: '2027-03-15' },
    { vehiculoId: 'veh-110', numeroPoliza: 'SOAT-DCV110-2026', aseguradora: 'AXA Colpatria', fechaInicioVigencia: '2027-01-20', fechaFinVigencia: '2028-01-20' },
  ],
  rtms: [
    { vehiculoId: 'veh-101', numeroCertificado: 'RTM-DCV101', cda: 'CDA Norte', fechaVencimiento: '2025-12-15', resultado: 'Aprobado' },
    { vehiculoId: 'veh-102', numeroCertificado: 'RTM-DCV102', cda: 'CDA Sur', fechaVencimiento: '2026-03-02', resultado: 'Aprobado' },
    { vehiculoId: 'veh-103', numeroCertificado: 'RTM-DCV103', cda: 'CDA Centro', fechaVencimiento: '2026-05-10', resultado: 'Aprobado' },
    { vehiculoId: 'veh-104', numeroCertificado: 'RTM-DCV104', cda: 'CDA Norte', fechaVencimiento: '2026-05-22', resultado: 'Aprobado' },
    { vehiculoId: 'veh-105', numeroCertificado: 'RTM-DCV105', cda: 'CDA Sur', fechaVencimiento: '2026-05-28', resultado: 'Aprobado' },
    { vehiculoId: 'veh-106', numeroCertificado: 'RTM-DCV106', cda: 'CDA Centro', fechaVencimiento: '2026-06-01', resultado: 'Aprobado' },
    { vehiculoId: 'veh-107', numeroCertificado: 'RTM-DCV107', cda: 'CDA Norte', fechaVencimiento: '2026-06-10', resultado: 'Aprobado' },
    { vehiculoId: 'veh-108', numeroCertificado: 'RTM-DCV108', cda: 'CDA Sur', fechaVencimiento: '2026-12-31', resultado: 'Aprobado' },
    { vehiculoId: 'veh-109', numeroCertificado: 'RTM-DCV109', cda: 'CDA Centro', fechaVencimiento: '2027-03-15', resultado: 'Aprobado' },
    { vehiculoId: 'veh-110', numeroCertificado: 'RTM-DCV110', cda: 'CDA Norte', fechaVencimiento: '2028-01-20', resultado: 'Aprobado' },
  ],
  preferences: {
    syntix_threshold: '15',
    syntix_simulated_date: '2026-05-22',
    syntix_dark_mode: 'true',
  },
});

const importConductores = async (records, summary) => {
  const documentToId = new Map();

  for (const [index, record] of records.entries()) {
    try {
      const response = await api.post('/conductores', {
        nombre: record.nombre,
        documento: record.documento,
        telefono: record.telefono,
        categoria: record.categoria || '',
        fechaVencimiento: record.fechaVencimiento,
      });

      documentToId.set(String(record.documento), String(response.data._id || response.data.id));
      summary.conductores.processed += 1;
    } catch (error) {
      summary.conductores.errors += 1;
      summary.errors.push(
        `Conductores fila ${index + 2} (${record.documento || 'sin documento'}): ${error.response?.data?.error || error.message}`
      );
    }
  }

  return documentToId;
};

const importVehiculos = async (records, documentToId, summary) => {
  const plateToId = new Map();

  for (const [index, record] of records.entries()) {
    try {
      const placa = normalizePlate(record.placa || '');
      if (!isValidPlate(placa)) {
        throw new Error('Placa invalida.');
      }

      const conductorId = record.conductorDocumento
        ? documentToId.get(String(record.conductorDocumento)) || null
        : null;

      const response = await api.post('/vehiculos', {
        placa,
        marca: record.marca,
        modelo: record.modelo,
        anio: Number(record.anio),
        tipo: record.tipo || 'Otro',
        conductorId,
      });

      plateToId.set(placa, String(response.data._id || response.data.id));
      summary.vehiculos.processed += 1;
    } catch (error) {
      summary.vehiculos.errors += 1;
      summary.errors.push(
        `Vehiculos fila ${index + 2} (${record.placa || 'sin placa'}): ${error.response?.data?.error || error.message}`
      );
    }
  }

  return plateToId;
};

const importSoats = async (records, plateToId, summary) => {
  for (const [index, record] of records.entries()) {
    try {
      const placa = normalizePlate(record.placaVehiculo || record.vehiculoPlaca || record.placa || '');
      const vehiculoId = plateToId.get(placa);

      if (!vehiculoId) {
        throw new Error('No existe vehiculo para la placa asociada.');
      }

      await api.post('/soats', {
        vehiculoId,
        placaVehiculo: placa,
        numeroPoliza: record.numeroPoliza,
        aseguradora: record.aseguradora,
        fechaExpedicion: record.fechaExpedicion,
        fechaInicioVigencia: record.fechaInicioVigencia,
        fechaFinVigencia: record.fechaFinVigencia,
        observaciones: record.observaciones || '',
      });

      summary.soats.processed += 1;
    } catch (error) {
      summary.soats.errors += 1;
      summary.errors.push(
        `SOAT fila ${index + 2} (${record.numeroPoliza || 'sin poliza'}): ${error.response?.data?.error || error.message}`
      );
    }
  }
};

const importRtms = async (records, plateToId, summary) => {
  for (const [index, record] of records.entries()) {
    try {
      const placa = normalizePlate(record.placaVehiculo || record.vehiculoPlaca || record.placa || '');
      const vehiculoId = plateToId.get(placa);

      if (!vehiculoId) {
        throw new Error('No existe vehiculo para la placa asociada.');
      }

      await api.post('/rtms', {
        vehiculoId,
        placaVehiculo: placa,
        numeroCertificado: record.numeroCertificado,
        cda: record.cda,
        nitCda: record.nitCda,
        fechaExpedicion: record.fechaExpedicion,
        fechaVencimiento: record.fechaVencimiento,
        resultado: record.resultado,
        observaciones: record.observaciones || '',
      });

      summary.rtms.processed += 1;
    } catch (error) {
      summary.rtms.errors += 1;
      summary.errors.push(
        `RTM fila ${index + 2} (${record.numeroCertificado || 'sin certificado'}): ${error.response?.data?.error || error.message}`
      );
    }
  }
};

export const importOperationalBackup = async (payload) => {
  const rawValidation = validateBackupPayload(payload);
  if (!rawValidation.valid) {
    throw new Error(formatValidationErrors(rawValidation));
  }

  const normalizedPayload = normalizeBackupPayload(payload);
  const validation = validateBackupPayload(normalizedPayload);
  if (!validation.valid) {
    throw new Error(formatValidationErrors(validation));
  }

  const sanitizedPayload = sanitizeBackupPayload(normalizedPayload);

  const summary = {
    conductores: { processed: 0, errors: 0 },
    vehiculos: { processed: 0, errors: 0 },
    soats: { processed: 0, errors: 0 },
    rtms: { processed: 0, errors: 0 },
    validaciones: { processed: 0, errors: 0 },
    errors: [],
  };

  const conductores = limitRecords(toArray(sanitizedPayload.conductores), 'conductores', summary.errors);
  const vehiculos = limitRecords(toArray(sanitizedPayload.vehiculos), 'vehiculos', summary.errors);
  const soats = limitRecords(toArray(sanitizedPayload.soats), 'soats', summary.errors);
  const rtms = limitRecords(toArray(sanitizedPayload.rtms), 'rtms', summary.errors);

  const documentToId = await importConductores(conductores, summary);
  const plateToId = await importVehiculos(vehiculos, documentToId, summary);
  await importSoats(soats, plateToId, summary);
  await importRtms(rtms, plateToId, summary);

  if (sanitizedPayload.preferences && typeof globalThis !== 'undefined' && globalThis.localStorage) {
    Object.entries(sanitizedPayload.preferences).forEach(([key, value]) => {
      const normalizedValue = normalizePreferenceValue(value);
      if (PREFERENCE_KEYS.includes(key) && normalizedValue !== '') {
        globalThis.localStorage.setItem(key, normalizedValue);
      }
    });
  }

  return summary;
};

const deleteAllByEndpoint = async (endpoint, records, summaryKey, summary) => {
  for (const record of records) {
    const id = record._id || record.id;
    if (!id) continue;

    try {
      await api.delete(`${endpoint}/${id}`);
      summary[summaryKey].processed += 1;
    } catch (error) {
      summary[summaryKey].errors += 1;
      summary.errors.push(
        `${summaryKey} ${id}: ${error.response?.data?.error || error.message}`
      );
    }
  }
};

export const resetOperationalData = async (userEmail) => {
  if (!userEmail) {
    throw new Error('No hay usuario autenticado.');
  }

  const params = { email: userEmail };
  const summary = {
    validaciones: { processed: 0, errors: 0 },
    soats: { processed: 0, errors: 0 },
    rtms: { processed: 0, errors: 0 },
    vehiculos: { processed: 0, errors: 0 },
    conductores: { processed: 0, errors: 0 },
    errors: [],
  };

  const [validacionesRes, soatsRes, rtmsRes, vehiculosRes, conductoresRes] = await Promise.all([
    api.get('/validaciones', { params }),
    api.get('/soats', { params }),
    api.get('/rtms', { params }),
    api.get('/vehiculos', { params }),
    api.get('/conductores', { params }),
  ]);

  await deleteAllByEndpoint('/validaciones', toArray(validacionesRes.data), 'validaciones', summary);
  await deleteAllByEndpoint('/soats', toArray(soatsRes.data), 'soats', summary);
  await deleteAllByEndpoint('/rtms', toArray(rtmsRes.data), 'rtms', summary);
  await deleteAllByEndpoint('/vehiculos', toArray(vehiculosRes.data), 'vehiculos', summary);
  await deleteAllByEndpoint('/conductores', toArray(conductoresRes.data), 'conductores', summary);

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    PREFERENCE_KEYS.forEach((key) => globalThis.localStorage.removeItem(key));
    Object.keys(globalThis.localStorage)
      .filter((key) => key.startsWith('syntix_onboarding_'))
      .forEach((key) => globalThis.localStorage.removeItem(key));
  }

  return summary;
};

const xmlEscape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const xmlUnescape = (value) =>
  String(value ?? '')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

const columnName = (index) => {
  let value = index + 1;
  let name = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
};

const columnIndexFromName = (name) =>
  String(name || '')
    .toUpperCase()
    .split('')
    .reduce((acc, letter) => acc * 26 + letter.charCodeAt(0) - 64, 0) - 1;

const isNumericCell = (value) =>
  typeof value === 'number' && Number.isFinite(value);

const buildCellXml = (value, rowIndex, columnIndex) => {
  const ref = `${columnName(columnIndex)}${rowIndex + 1}`;

  if (isNumericCell(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }

  return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
};

const buildWorksheetXml = (rows) => {
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => buildCellXml(value, rowIndex, columnIndex)).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${rowXml}</sheetData></worksheet>`;
};

const rowsFromRecords = (columns, records) => [
  columns,
  ...records.map((record) => columns.map((column) => {
    if (column === 'placa') {
      return record.placaVehiculo || record.vehiculoPlaca || record.placa || '';
    }

    return record[column] ?? '';
  })),
];

const buildInstructionRows = () => [
  EXCEL_COLUMNS[EXCEL_SHEET_NAMES.instructions],
  ['Formato de fechas', 'Usa YYYY-MM-DD, por ejemplo 2026-05-22.'],
  ['Campos obligatorios', 'Vehiculos: placa. Conductores: nombre, documento, telefono, categoria y fechaVencimiento. SOAT: placa y numeroPoliza. RTM: placa, numeroCertificado y fechaVencimiento.'],
  ['Normalizacion', 'Los documentos tipo CC1000000001 se importan como 1000000001 y Requiere seguimiento en RTM se importa como Pendiente.'],
  ['Alertas', 'No se importan ni exportan alertas; DriveControl las recalcula automaticamente.'],
  ['Seguridad', 'No incluyas password, token, jwt, accessToken, refreshToken, secret, clientSecret, EMAIL_PASS, TWILIO_AUTH_TOKEN, MONGO_URI, JWT_SECRET ni .env.'],
  ['Ownership', 'ownerEmail y ownerEmpresa se ignoran; el backend usa el usuario autenticado.'],
  ['Limites', `Maximos: ${ENTITY_RECORD_LIMITS.vehiculos} vehiculos, ${ENTITY_RECORD_LIMITS.conductores} conductores, ${ENTITY_RECORD_LIMITS.soats} SOAT, ${ENTITY_RECORD_LIMITS.rtms} RTM. Tamano maximo recomendado: 5 MB.`],
  ['Orden recomendado', 'Conductores, Vehiculos, SOAT, RTM y luego revisar Alertas.'],
];

const buildWorkbookSheets = (payload) => {
  const normalized = normalizeBackupPayload(payload);

  return [
    {
      name: EXCEL_SHEET_NAMES.vehiculos,
      rows: rowsFromRecords(EXCEL_COLUMNS[EXCEL_SHEET_NAMES.vehiculos], normalized.vehiculos),
    },
    {
      name: EXCEL_SHEET_NAMES.conductores,
      rows: rowsFromRecords(EXCEL_COLUMNS[EXCEL_SHEET_NAMES.conductores], normalized.conductores),
    },
    {
      name: EXCEL_SHEET_NAMES.soats,
      rows: rowsFromRecords(EXCEL_COLUMNS[EXCEL_SHEET_NAMES.soats], normalized.soats),
    },
    {
      name: EXCEL_SHEET_NAMES.rtms,
      rows: rowsFromRecords(EXCEL_COLUMNS[EXCEL_SHEET_NAMES.rtms], normalized.rtms),
    },
    {
      name: EXCEL_SHEET_NAMES.validaciones,
      rows: rowsFromRecords(EXCEL_COLUMNS[EXCEL_SHEET_NAMES.validaciones], normalized.validaciones),
    },
    {
      name: EXCEL_SHEET_NAMES.preferences,
      rows: [
        EXCEL_COLUMNS[EXCEL_SHEET_NAMES.preferences],
        ...PREFERENCE_KEYS.map((key) => [key, normalized.preferences[key] ?? '']),
      ],
    },
    {
      name: EXCEL_SHEET_NAMES.instructions,
      rows: buildInstructionRows(),
    },
  ];
};

const encodeText = (value) => new TextEncoder().encode(String(value));

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const pushUint16 = (target, value) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const pushUint32 = (target, value) => {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
};

const concatBytes = (chunks) => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
};

const createZip = (entries) => {
  const fileChunks = [];
  const centralChunks = [];
  let offset = 0;

  entries.forEach(({ path, content }) => {
    const nameBytes = encodeText(path);
    const contentBytes = content instanceof Uint8Array ? content : encodeText(content);
    const checksum = crc32(contentBytes);
    const localHeader = [];

    pushUint32(localHeader, 0x04034b50);
    pushUint16(localHeader, 20);
    pushUint16(localHeader, 0x0800);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint32(localHeader, checksum);
    pushUint32(localHeader, contentBytes.length);
    pushUint32(localHeader, contentBytes.length);
    pushUint16(localHeader, nameBytes.length);
    pushUint16(localHeader, 0);

    fileChunks.push(Uint8Array.from(localHeader), nameBytes, contentBytes);

    const centralHeader = [];
    pushUint32(centralHeader, 0x02014b50);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 0x0800);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, checksum);
    pushUint32(centralHeader, contentBytes.length);
    pushUint32(centralHeader, contentBytes.length);
    pushUint16(centralHeader, nameBytes.length);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, 0);
    pushUint32(centralHeader, offset);

    centralChunks.push(Uint8Array.from(centralHeader), nameBytes);
    offset += localHeader.length + nameBytes.length + contentBytes.length;
  });

  const centralDirectory = concatBytes(centralChunks);
  const end = [];
  pushUint32(end, 0x06054b50);
  pushUint16(end, 0);
  pushUint16(end, 0);
  pushUint16(end, entries.length);
  pushUint16(end, entries.length);
  pushUint32(end, centralDirectory.length);
  pushUint32(end, offset);
  pushUint16(end, 0);

  return concatBytes([...fileChunks, centralDirectory, Uint8Array.from(end)]);
};

export const buildExcelWorkbook = (payload) => {
  const sheets = buildWorkbookSheets(payload);
  const sheetOverrides = sheets.map((sheet, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ` +
    `ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join('');
  const workbookSheets = sheets.map((sheet, index) =>
    `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join('');
  const workbookRelationships = sheets.map((sheet, index) =>
    `<Relationship Id="rId${index + 1}" ` +
    `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ` +
    `Target="worksheets/sheet${index + 1}.xml"/>`
  ).join('');

  const entries = [
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        sheetOverrides +
        `</Types>`,
    },
    {
      path: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      path: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>${workbookSheets}</sheets></workbook>`,
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        workbookRelationships +
        `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    {
      path: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>` +
        `<fills count="1"><fill><patternFill patternType="none"/></fill></fills>` +
        `<borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs>` +
        `<cellXfs count="1"><xf xfId="0"/></cellXfs></styleSheet>`,
    },
    ...sheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      content: buildWorksheetXml(sheet.rows),
    })),
  ];

  return createZip(entries);
};

const readUint16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
const readUint32 = (bytes, offset) =>
  (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;

const inflateRaw = async (bytes) => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Este entorno no puede leer hojas Excel comprimidas.');
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const unzipEntries = async (arrayBuffer) => {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  let endOffset = -1;

  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (readUint32(bytes, index) === 0x06054b50) {
      endOffset = index;
      break;
    }
  }

  if (endOffset < 0) {
    throw new Error('El archivo Excel no tiene una estructura XLSX valida.');
  }

  const entryCount = readUint16(bytes, endOffset + 10);
  let centralOffset = readUint32(bytes, endOffset + 16);
  const entries = {};

  for (let index = 0; index < entryCount; index += 1) {
    if (readUint32(bytes, centralOffset) !== 0x02014b50) {
      throw new Error('El directorio central del Excel es invalido.');
    }

    const method = readUint16(bytes, centralOffset + 10);
    const compressedSize = readUint32(bytes, centralOffset + 20);
    const nameLength = readUint16(bytes, centralOffset + 28);
    const extraLength = readUint16(bytes, centralOffset + 30);
    const commentLength = readUint16(bytes, centralOffset + 32);
    const localOffset = readUint32(bytes, centralOffset + 42);
    const name = new TextDecoder().decode(bytes.slice(centralOffset + 46, centralOffset + 46 + nameLength));
    const localNameLength = readUint16(bytes, localOffset + 26);
    const localExtraLength = readUint16(bytes, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.slice(dataStart, dataStart + compressedSize);
    const content = method === 0 ? data : await inflateRaw(data);

    entries[name] = new TextDecoder().decode(content);
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
};

const parseAttributes = (source = '') => {
  const attrs = {};
  const input = String(source);
  let index = 0;

  const isWhitespace = (char) =>
    char === ' ' || char === '\n' || char === '\r' || char === '\t' || char === '\f';

  while (index < input.length) {
    while (index < input.length && isWhitespace(input[index])) {
      index += 1;
    }

    const nameStart = index;

    while (
      index < input.length &&
      input[index] !== '=' &&
      !isWhitespace(input[index])
    ) {
      index += 1;
    }

    const name = input.slice(nameStart, index);

    while (index < input.length && isWhitespace(input[index])) {
      index += 1;
    }

    if (!name || input[index] !== '=') {
      index += 1;
      continue;
    }

    index += 1;

    while (index < input.length && isWhitespace(input[index])) {
      index += 1;
    }

    if (input[index] !== '"') {
      while (index < input.length && !isWhitespace(input[index])) {
        index += 1;
      }
      continue;
    }

    index += 1;

    const valueStart = index;

    while (index < input.length && input[index] !== '"') {
      index += 1;
    }

    if (index >= input.length) {
      break;
    }

    attrs[name] = xmlUnescape(input.slice(valueStart, index));
    index += 1;
  }

  return attrs;
};

const parseSharedStrings = (xml = '') => {
  const strings = [];
  for (const match of xml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)) {
    const text = [...match[1].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)]
      .map((textMatch) => xmlUnescape(textMatch[1]))
      .join('');
    strings.push(text);
  }
  return strings;
};

const getCellValue = (attrs, cellXml, sharedStrings) => {
  if (attrs.t === 'inlineStr') {
    const match = cellXml.match(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/);
    return match ? xmlUnescape(match[1]) : '';
  }

  const valueMatch = cellXml.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/);
  if (!valueMatch) {
    return '';
  }

  if (attrs.t === 's') {
    return sharedStrings[Number(valueMatch[1])] || '';
  }

  return xmlUnescape(valueMatch[1]);
};

const parseWorksheetRows = (xml = '', sharedStrings = []) => {
  const rows = [];

  for (const rowMatch of xml.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const rowValues = [];

    for (const cellMatch of rowMatch[1].matchAll(/<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g)) {
      const attrs = parseAttributes(cellMatch[1]);
      const columnMatch = attrs.r?.match(/[A-Z]+/i);
      const columnIndex = columnIndexFromName(columnMatch ? columnMatch[0] : columnName(rowValues.length));
      rowValues[columnIndex] = getCellValue(attrs, cellMatch[2], sharedStrings);
    }

    while (rowValues.length > 0 && !rowValues[rowValues.length - 1]) {
      rowValues.pop();
    }
    rows.push(rowValues);
  }

  return rows;
};

const rowsToObjects = (rows) => {
  const [headers = [], ...records] = rows;
  const normalizedHeaders = headers.map((header) => {
    const trimmedHeader = String(header || '').trim();
    return EXCEL_HEADER_ALIASES[normalizeFieldName(trimmedHeader)] || trimmedHeader;
  });

  return records
    .map((row) => normalizedHeaders.reduce((acc, header, index) => {
      if (header) {
        acc[header] = row[index] ?? '';
      }
      return acc;
    }, {}))
    .filter((record) => Object.values(record).some((value) => String(value ?? '').trim() !== ''));
};

const parseWorkbookSheets = (entries) => {
  const workbookXml = entries['xl/workbook.xml'];
  const relationshipsXml = entries['xl/_rels/workbook.xml.rels'];

  if (!workbookXml || !relationshipsXml) {
    throw new Error('El Excel no contiene libro ni relaciones validas.');
  }

  const relationshipById = {};
  for (const match of relationshipsXml.matchAll(/<(?:\w+:)?Relationship\b([^>]*)\/>/g)) {
    const attrs = parseAttributes(match[1]);
    relationshipById[attrs.Id] = attrs.Target;
  }

  return [...workbookXml.matchAll(/<(?:\w+:)?sheet\b([^>]*)\/>/g)].map((match) => {
    const attrs = parseAttributes(match[1]);
    const target = relationshipById[attrs['r:id']] || '';
    const normalizedTarget = target.startsWith('/') ? target.slice(1) : `xl/${target}`;

    return {
      name: attrs.name,
      path: normalizedTarget.replace(/\/\.\//g, '/'),
    };
  });
};

const payloadFromExcelRows = (rowsBySheet) => {
  const preferences = rowsToObjects(rowsBySheet[EXCEL_SHEET_NAMES.preferences] || [])
    .reduce((acc, record) => {
      const key = String(record.clave || '').trim();
      if (PREFERENCE_KEYS.includes(key)) {
        acc[key] = normalizePreferenceValue(record.valor);
      }
      return acc;
    }, {});

  return normalizeBackupPayload({
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    vehiculos: rowsToObjects(rowsBySheet[EXCEL_SHEET_NAMES.vehiculos] || []),
    conductores: rowsToObjects(rowsBySheet[EXCEL_SHEET_NAMES.conductores] || []),
    soats: rowsToObjects(rowsBySheet[EXCEL_SHEET_NAMES.soats] || []).map((record) => ({
      ...record,
      placaVehiculo: record.placa,
    })),
    rtms: rowsToObjects(rowsBySheet[EXCEL_SHEET_NAMES.rtms] || []).map((record) => ({
      ...record,
      placaVehiculo: record.placa,
    })),
    validaciones: rowsToObjects(rowsBySheet[EXCEL_SHEET_NAMES.validaciones] || []),
    preferences,
    notes: BACKUP_NOTES,
  });
};

export const parseExcelBackup = async (arrayBuffer) => {
  const entries = await unzipEntries(arrayBuffer);
  const sheets = parseWorkbookSheets(entries);
  const rowsBySheet = {};
  const sharedStrings = parseSharedStrings(entries['xl/sharedStrings.xml']);
  const requiredSheets = Object.values(EXCEL_SHEET_NAMES);

  requiredSheets.forEach((sheetName) => {
    if (!sheets.some((sheet) => sheet.name === sheetName)) {
      throw new Error(`El Excel no contiene la hoja requerida ${sheetName}.`);
    }
  });

  sheets.forEach((sheet) => {
    rowsBySheet[sheet.name] = parseWorksheetRows(entries[sheet.path], sharedStrings);
  });

  return payloadFromExcelRows(rowsBySheet);
};

export const downloadExcelBackup = (payload, fileName = buildBackupFileName(new Date(), 'xlsx')) => {
  const workbookBytes = buildExcelWorkbook(payload);
  const blob = new Blob([workbookBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadJsonBackup = (payload, fileName = buildBackupFileName()) => {
  const blob = new Blob([serializeJsonBackup(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
