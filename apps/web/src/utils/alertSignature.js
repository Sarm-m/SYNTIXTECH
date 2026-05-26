const SIGNATURE_FIELDS = [
  'id',
  'tipo',
  'categoria',
  'grupo',
  'prioridad',
  'diasRestantes',
  'fechaVencimiento',
  'fechaFinVigencia',
  'mensaje',
  'entidad',
];

const normalizeAlertField = (value) => {
  if (value === undefined || value === null) return '';
  return String(value);
};

const compareAlphabetically = (left, right) =>
  String(left).localeCompare(String(right), 'es', { sensitivity: 'base' });

export const buildAlertSignature = (alerts = []) => {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return '';
  }

  return alerts
    .map((alert) => SIGNATURE_FIELDS
      .map((field) => normalizeAlertField(alert?.[field]))
      .join('|'))
    .sort(compareAlphabetically)
    .join('||');
};

export const buildSourcesSignature = (sources = {}) => {
  const keys = ['soats', 'rtms', 'conductores', 'vehiculos'];
  return keys
    .map((key) => `${key}:${buildAlertSignature(sources[key] || [])}`)
    .join(';;');
};
