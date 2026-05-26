import BaseAlertAdapter from './BaseAlertAdapter.js';
import { getDocumentStatusReason } from '@/utils/dateUtils.js';
import { isValidPlate, normalizePlate } from '@/utils/colombiaFormats.js';

const buildVehicleEntity = (rtm) => {
  const placa = normalizePlate(rtm.placaVehiculo || rtm.vehiculoPlaca || rtm.placa || '');
  return isValidPlate(placa) ? `Vehiculo ${placa}` : 'Vehiculo no encontrado';
};

// Genera alertas a partir de vencimientos o proximidad de la tecnomecanica.
export default class RtmAlertAdapter extends BaseAlertAdapter {
  adapt(rtm) {
    if (rtm.estado !== 'rojo' && rtm.estado !== 'amarillo') {
      return null;
    }

    return {
      id: `rtm-${rtm.id}`,
      tipo: 'RTM',
      categoria: 'vehiculos',
      grupo: 'RTM',
      entidad: buildVehicleEntity(rtm),
      mensaje:
        rtm.estado === 'rojo'
          ? 'RTM vencida'
          : 'RTM proxima a vencer',
      reason: getDocumentStatusReason({
        documentLabel: 'RTM',
        daysRemaining: rtm.diasRestantes,
        status: rtm.estado,
      }),
      diasRestantes: rtm.diasRestantes,
      fechaVencimiento: rtm.fechaVencimiento || null,
      prioridad: rtm.estado,
      fecha: rtm.fechaVencimiento || null,
    };
  }
}
