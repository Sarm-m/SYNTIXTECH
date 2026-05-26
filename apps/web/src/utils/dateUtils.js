const MS_PER_DAY = 1000 * 60 * 60 * 24;

const isInvalidDate = (date) => Number.isNaN(date.getTime());
const DEFAULT_WARNING_THRESHOLD_DAYS = 15;

const STATUS_LABELS = {
  verde: 'Al d\u00eda',
  amarillo: 'Por vencer',
  rojo: 'Cr\u00edtico',
  neutral: 'Sin datos',
};

const DOCUMENT_REASON_COPY = {
  SOAT: {
    expired: 'SOAT vencido',
    due: 'SOAT vence',
    ok: 'SOAT vigente',
    unavailable: 'SOAT sin fecha',
  },
  RTM: {
    expired: 'RTM vencida',
    due: 'RTM vence',
    ok: 'RTM vigente',
    unavailable: 'RTM sin fecha',
  },
  Licencia: {
    expired: 'Licencia vencida',
    due: 'Licencia vence',
    ok: 'Licencia vigente',
    unavailable: 'Licencia sin fecha',
  },
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;

  const value = String(dateStr).trim();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      isInvalidDate(date) ||
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(value);
  return isInvalidDate(date) ? null : date;
};

const pluralizeDays = (days) => (Math.abs(days) === 1 ? 'd\u00eda' : 'd\u00edas');

const getUniqueReasons = (reasons) => [...new Set(reasons.filter(Boolean))];

export const getStatusLabel = (state) => {
  const normalizedState = String(state || '').toLowerCase();
  return STATUS_LABELS[normalizedState] || STATUS_LABELS.neutral;
};

export const getRelativeExpirationText = (daysRemaining) => {
  if (!Number.isFinite(daysRemaining) || daysRemaining === -999) {
    return 'Fecha no disponible';
  }

  if (daysRemaining < 0) {
    const expiredDays = Math.abs(daysRemaining);
    return `Vencido hace ${expiredDays} ${pluralizeDays(expiredDays)}`;
  }

  if (daysRemaining === 0) {
    return 'Vence hoy';
  }

  if (daysRemaining === 1) {
    return 'Falta 1 d\u00eda';
  }

  return `Faltan ${daysRemaining} d\u00edas`;
};

const getDocumentReasonCopy = (documentLabel = 'Documento') => {
  const label = String(documentLabel || 'Documento').trim() || 'Documento';

  if (DOCUMENT_REASON_COPY[label]) {
    return DOCUMENT_REASON_COPY[label];
  }

  return {
    expired: `${label} vencido`,
    due: `${label} vence`,
    ok: `${label} vigente`,
    unavailable: `${label} sin fecha`,
  };
};

export const getDocumentStatusReason = ({
  documentLabel = 'Documento',
  daysRemaining,
  status,
  warningThresholdDays = DEFAULT_WARNING_THRESHOLD_DAYS,
} = {}) => {
  const copy = getDocumentReasonCopy(documentLabel);

  if (!Number.isFinite(daysRemaining) || daysRemaining === -999) {
    return copy.unavailable;
  }

  if (daysRemaining < 0) {
    const expiredDays = Math.abs(daysRemaining);
    return `${copy.expired} hace ${expiredDays} ${pluralizeDays(expiredDays)}`;
  }

  if (daysRemaining === 0) {
    return `${copy.due} hoy`;
  }

  if (status === 'verde' || daysRemaining > warningThresholdDays) {
    return copy.ok;
  }

  if (daysRemaining === 1) {
    return `${copy.due} en 1 d\u00eda`;
  }

  return `${copy.due} en ${daysRemaining} d\u00edas`;
};

export const formatColombianDate = (dateStr) => {
  const date = parseLocalDate(dateStr);
  if (!date) return 'Fecha no disponible';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const getExpirationAlertText = (daysRemaining, expirationDate) => {
  const formattedDate = formatColombianDate(expirationDate);

  if (formattedDate === 'Fecha no disponible') {
    return {
      primaryText: 'Fecha no disponible',
      dateText: 'Fecha no disponible',
      fullText: 'Fecha no disponible',
    };
  }

  if (!Number.isFinite(daysRemaining) || daysRemaining === -999) {
    return {
      primaryText: 'Fecha no disponible',
      dateText: formattedDate,
      fullText: `Fecha no disponible \u00b7 ${formattedDate}`,
    };
  }

  if (daysRemaining < 0) {
    const primaryText = getRelativeExpirationText(daysRemaining);
    const dateText = `Venci\u00f3 el ${formattedDate}`;

    return {
      primaryText,
      dateText,
      fullText: `${primaryText} \u00b7 ${dateText}`,
    };
  }

  if (daysRemaining === 0) {
    const primaryText = getRelativeExpirationText(daysRemaining);

    return {
      primaryText,
      dateText: formattedDate,
      fullText: `${primaryText} \u00b7 ${formattedDate}`,
    };
  }

  const primaryText = getRelativeExpirationText(daysRemaining);
  const dateText = `Vence el ${formattedDate}`;

  return {
    primaryText,
    dateText,
    fullText: `${primaryText} \u00b7 ${dateText}`,
  };
};

// Calcula diferencia en dias normalizando ambas fechas a medianoche para evitar desfases por hora.
export const calculateDaysRemaining = (targetDateStr, simulatedDateStr) => {
  if (!targetDateStr) return -999;

  const target = parseLocalDate(targetDateStr);
  const current = simulatedDateStr ? parseLocalDate(simulatedDateStr) : new Date();

  if (!target || !current || isInvalidDate(current)) return -999;

  target.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - current.getTime();
  return Math.ceil(diffTime / MS_PER_DAY);
};

// Convierte dias restantes en el semaforo documental que usan paginas, hooks y alertas.
export const calculateDocumentState = (daysRemaining, threshold = 15) => {
  if (!Number.isFinite(daysRemaining) || daysRemaining <= 0 || daysRemaining === -999) {
    return 'rojo';
  }
  if (daysRemaining <= threshold) return 'amarillo';

  return 'verde';
};

export const getDocumentStatus = ({
  expirationDate,
  referenceDate,
  warningThresholdDays = DEFAULT_WARNING_THRESHOLD_DAYS,
  documentLabel = 'Documento',
} = {}) => {
  const daysRemaining = calculateDaysRemaining(expirationDate, referenceDate);
  const status = calculateDocumentState(daysRemaining, warningThresholdDays);

  return {
    status,
    label: getStatusLabel(status),
    tone: status,
    daysRemaining,
    relativeText: getRelativeExpirationText(daysRemaining),
    reason: getDocumentStatusReason({
      documentLabel,
      daysRemaining,
      status,
      warningThresholdDays,
    }),
  };
};

// Cuando un vehiculo combina varios documentos, siempre manda el estado mas critico.
export const getWorstState = (state1, state2) => {
  const priority = { rojo: 3, amarillo: 2, verde: 1 };
  const p1 = priority[state1] || 3;
  const p2 = priority[state2] || 3;

  if (p1 >= p2) return state1 || 'rojo';
  return state2 || 'rojo';
};

const buildDocumentReason = (documentLabel, document) =>
  getDocumentStatusReason({
    documentLabel,
    daysRemaining: document?.diasRestantes,
    status: document?.estado,
  });

const collectVehicleReasonsByStatus = (vehicle = {}, targetStatus) => {
  const reasons = [];

  if (vehicle.soat?.estado === targetStatus) {
    reasons.push(buildDocumentReason('SOAT', vehicle.soat));
  } else if (targetStatus === 'rojo' && !vehicle.soat) {
    reasons.push('Sin SOAT registrado');
  }

  if (vehicle.rtm?.estado === targetStatus) {
    reasons.push(buildDocumentReason('RTM', vehicle.rtm));
  } else if (targetStatus === 'rojo' && !vehicle.rtm) {
    reasons.push('Sin RTM registrada');
  }

  if (vehicle.conductor?.estado === targetStatus) {
    reasons.push(buildDocumentReason('Licencia', vehicle.conductor));
  } else if (targetStatus === 'rojo' && vehicle.conductorId && !vehicle.conductor) {
    reasons.push('Licencia sin fecha');
  }

  if (targetStatus === 'rojo' && !vehicle.conductorId && !vehicle.conductor) {
    reasons.push('Sin conductor asignado');
  }

  return reasons;
};

export const getVehicleStatusSummary = (vehicle = {}) => {
  const criticalReasons = collectVehicleReasonsByStatus(vehicle, 'rojo');
  const warningReasons = collectVehicleReasonsByStatus(vehicle, 'amarillo');
  let status = 'verde';
  let statusReasons = ['Documentos vigentes'];

  if (criticalReasons.length > 0) {
    status = 'rojo';
    statusReasons = criticalReasons;
  } else if (warningReasons.length > 0) {
    status = 'amarillo';
    statusReasons = warningReasons;
  }

  const reasons = getUniqueReasons(statusReasons);

  return {
    status,
    label: getStatusLabel(status),
    reason: reasons[0] || 'Documentos vigentes',
    reasons,
  };
};
