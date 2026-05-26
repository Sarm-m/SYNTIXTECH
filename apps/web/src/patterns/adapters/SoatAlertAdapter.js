import BaseAlertAdapter from './BaseAlertAdapter.js';
import { getDocumentStatusReason } from '@/utils/dateUtils.js';
import { isValidPlate, normalizePlate } from '@/utils/colombiaFormats.js';

const buildVehicleEntity = (soat) => {
  const placa = normalizePlate(soat.placaVehiculo || soat.vehiculoPlaca || soat.placa || '');
  return isValidPlate(placa) ? `Vehiculo ${placa}` : 'Vehiculo no encontrado';
};

// Genera alertas de SOAT usando el mismo contrato que el resto de fuentes documentales.
export default class SoatAlertAdapter extends BaseAlertAdapter {
  adapt(soat) {
    if (soat.estado !== 'rojo' && soat.estado !== 'amarillo') {
      return null;
    }

    const fechaFinVigencia = soat.fechaFinVigencia || soat.fechaVencimiento || null;

    return {
      id: `soat-${soat.id}`,
      tipo: 'SOAT',
      categoria: 'vehiculos',
      grupo: 'SOAT',
      entidad: buildVehicleEntity(soat),
      mensaje:
        soat.estado === 'rojo'
          ? 'SOAT vencido'
          : 'SOAT proximo a vencer',
      reason: getDocumentStatusReason({
        documentLabel: 'SOAT',
        daysRemaining: soat.diasRestantes,
        status: soat.estado,
      }),
      diasRestantes: soat.diasRestantes,
      fechaVencimiento: fechaFinVigencia,
      fechaFinVigencia,
      prioridad: soat.estado,
      fecha: fechaFinVigencia || null,
    };
  }
}
