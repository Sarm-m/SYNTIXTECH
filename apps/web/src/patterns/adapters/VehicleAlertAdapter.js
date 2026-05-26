import BaseAlertAdapter from './BaseAlertAdapter.js';

const FALLBACK_ALERT_DATE = '1970-01-01';

const resolveStableAlertDate = (vehiculo) => {
  const candidate = vehiculo?.createdAt || vehiculo?.fechaRegistro || vehiculo?.updatedAt;
  if (candidate && !Number.isNaN(Date.parse(candidate))) {
    return candidate;
  }

  return FALLBACK_ALERT_DATE;
};

// Detecta huecos estructurales del vehiculo que afectan la Regla de Oro.
export default class VehicleAlertAdapter extends BaseAlertAdapter {
  adapt(vehiculo) {
    const alerts = [];
    const vehicleLabel = `Vehiculo ${vehiculo.placa}`;
    const fecha = resolveStableAlertDate(vehiculo);

    if (!vehiculo.conductorId) {
      alerts.push({
        id: `missing-cond-${vehiculo.id}`,
        tipo: 'Asignacion',
        categoria: 'conductores',
        grupo: 'Licencias',
        entidad: vehicleLabel,
        mensaje: 'Sin conductor asignado',
        reason: 'Sin conductor asignado',
        diasRestantes: 0,
        prioridad: 'rojo',
        fecha,
      });
    }

    if (!vehiculo.soat) {
      alerts.push({
        id: `missing-soat-${vehiculo.id}`,
        tipo: 'Documento Faltante',
        categoria: 'vehiculos',
        grupo: 'SOAT',
        entidad: vehicleLabel,
        mensaje: 'Sin SOAT registrado',
        reason: 'Sin SOAT registrado',
        diasRestantes: 0,
        prioridad: 'rojo',
        fecha,
      });
    }

    if (!vehiculo.rtm) {
      alerts.push({
        id: `missing-rtm-${vehiculo.id}`,
        tipo: 'Documento Faltante',
        categoria: 'vehiculos',
        grupo: 'RTM',
        entidad: vehicleLabel,
        mensaje: 'Sin RTM registrada',
        reason: 'Sin RTM registrada',
        diasRestantes: 0,
        prioridad: 'rojo',
        fecha,
      });
    }

    return alerts;
  }
}
