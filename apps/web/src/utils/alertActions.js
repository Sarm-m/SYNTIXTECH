const normalizeEntityLabel = (value = '') => String(value).replace(/^Vehiculo\b/i, 'Vehículo');
const hasAlertPrefix = (alert, prefix) => String(alert?.id || '').startsWith(prefix);

export const getAlertSourceId = (alert, prefix) => String(alert?.id || '').slice(prefix.length);

export function getAlertActionModel(alert = {}) {
  const isMissingSoat = hasAlertPrefix(alert, 'missing-soat-');
  const isMissingRtm = hasAlertPrefix(alert, 'missing-rtm-');
  const isMissingConductor = hasAlertPrefix(alert, 'missing-cond-');
  const isSoat = alert.grupo === 'SOAT' || hasAlertPrefix(alert, 'soat-');
  const isRtm = alert.grupo === 'RTM' || hasAlertPrefix(alert, 'rtm-');
  const isLicense = alert.grupo === 'Licencias' || hasAlertPrefix(alert, 'lic-');

  if (isMissingSoat) {
    return {
      primary: { label: 'Registrar SOAT', kind: 'register-soat', route: '/documentos', canMutate: true },
      secondary: { label: 'Ver vehículo', route: '/vehiculos' },
    };
  }

  if (isMissingRtm) {
    return {
      primary: { label: 'Registrar RTM', kind: 'register-rtm', route: '/documentos', canMutate: true },
      secondary: { label: 'Ver vehículo', route: '/vehiculos' },
    };
  }

  if (isSoat) {
    return {
      primary: { label: 'Actualizar documento', kind: 'update-soat', route: '/documentos', canMutate: true },
      secondary: { label: 'Ver vehículo', route: '/vehiculos' },
    };
  }

  if (isRtm) {
    return {
      primary: { label: 'Actualizar documento', kind: 'update-rtm', route: '/documentos', canMutate: true },
      secondary: { label: 'Ver vehículo', route: '/vehiculos' },
    };
  }

  if (isMissingConductor) {
    return {
      primary: { label: 'Gestionar conductores', kind: 'view-conductors', route: '/conductores', canMutate: false },
      secondary: { label: 'Ver vehículo', route: '/vehiculos' },
    };
  }

  if (isLicense) {
    return {
      primary: { label: 'Actualizar licencia', kind: 'update-license', route: '/conductores', canMutate: true },
      secondary: { label: 'Ver conductor', route: '/conductores' },
    };
  }

  return {
    primary: { label: 'Revisar alerta', kind: 'view-alert', route: '/alertas', canMutate: false },
    secondary: { label: 'Ver documentos', route: '/documentos' },
  };
}

export function getAlertPresentation(alert = {}) {
  const entity = normalizeEntityLabel(alert.entidad || 'El registro');
  const isMissingSoat = hasAlertPrefix(alert, 'missing-soat-');
  const isMissingRtm = hasAlertPrefix(alert, 'missing-rtm-');
  const isMissingConductor = hasAlertPrefix(alert, 'missing-cond-');
  const isCritical = alert.prioridad === 'rojo';

  if (isMissingSoat) {
    return {
      title: 'Documento faltante',
      description: `${entity} requiere registro de SOAT para quedar al día.`,
      guidance: 'Registra la póliza para cerrar esta alerta.',
    };
  }

  if (isMissingRtm) {
    return {
      title: 'RTM no registrada',
      description: `${entity} no tiene una revisión técnico-mecánica registrada.`,
      guidance: 'Registra la revisión técnico-mecánica para cerrar esta alerta.',
    };
  }

  if (isMissingConductor) {
    return {
      title: 'Conductor no asignado',
      description: `${entity} requiere un conductor asignado para completar su control operativo.`,
      guidance: 'Asigna un conductor disponible o registra uno nuevo.',
    };
  }

  if (alert.grupo === 'Licencias') {
    return {
      title: isCritical ? 'Licencia vencida' : 'Licencia próxima a vencer',
      description: `${entity} requiere actualizar la vigencia de su licencia.`,
      guidance: alert.reason || 'Revisa la fecha de vencimiento de la licencia.',
    };
  }

  return {
    title: alert.mensaje || (isCritical ? 'Documento vencido' : 'Documento próximo a vencer'),
    description: `${entity} requiere seguimiento de ${alert.grupo || alert.tipo || 'su documentación'}.`,
    guidance: alert.reason || 'Revisa el documento y actualiza su vigencia.',
  };
}

export function getAlertsSummary(alerts = []) {
  const affectedVehicles = new Set(
    alerts
      .filter((alert) => alert.categoria === 'vehiculos')
      .map((alert) => normalizeEntityLabel(alert.entidad))
      .filter(Boolean)
  );
  const affectedConductors = new Set(
    alerts
      .filter((alert) => alert.categoria === 'conductores')
      .map((alert) => normalizeEntityLabel(alert.entidad))
      .filter(Boolean)
  );

  return {
    critical: alerts.filter((alert) => alert.prioridad === 'rojo').length,
    preventive: alerts.filter((alert) => alert.prioridad === 'amarillo').length,
    vehicles: affectedVehicles.size,
    conductors: affectedConductors.size,
  };
}
