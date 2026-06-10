export const ALERT_THRESHOLD_MIN = 1;
export const ALERT_THRESHOLD_MAX = 60;

export const isThresholdDraft = (value) => /^\d*$/.test(String(value ?? ''));

export const validateAlertThreshold = (value) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return {
      valid: false,
      message: 'Ingresa un umbral de alerta.',
    };
  }

  if (!/^\d+$/.test(text)) {
    return {
      valid: false,
      message: 'El umbral debe ser un numero entero.',
    };
  }

  const threshold = Number(text);
  if (!Number.isInteger(threshold) || threshold < ALERT_THRESHOLD_MIN || threshold > ALERT_THRESHOLD_MAX) {
    return {
      valid: false,
      message: `El umbral debe estar entre ${ALERT_THRESHOLD_MIN} y ${ALERT_THRESHOLD_MAX} dias.`,
    };
  }

  return {
    valid: true,
    value: threshold,
    normalized: String(threshold),
    message: '',
  };
};
