import { buildSampleBackupPayload } from '@/utils/dataBackup.js';
import {
  calculateDaysRemaining,
  calculateDocumentState,
  getVehicleStatusSummary,
  getWorstState,
} from '@/utils/dateUtils.js';
import SoatAlertAdapter from '@/patterns/adapters/SoatAlertAdapter.js';
import RtmAlertAdapter from '@/patterns/adapters/RtmAlertAdapter.js';
import ConductorAlertAdapter from '@/patterns/adapters/ConductorAlertAdapter.js';
import VehicleAlertAdapter from '@/patterns/adapters/VehicleAlertAdapter.js';
import PriorityAlertSortStrategy from '@/patterns/strategy/PriorityAlertSortStrategy.js';
import { buildQualityMetricsSummary } from '@/utils/qualityMetrics.js';

const WARNING_THRESHOLD = 15;
const soatAdapter = new SoatAlertAdapter();
const rtmAdapter = new RtmAlertAdapter();
const conductorAdapter = new ConductorAlertAdapter();
const vehicleAdapter = new VehicleAlertAdapter();
const alertSorter = new PriorityAlertSortStrategy();

const toIsoDate = (baseDate, offsetDays) => {
  const date = new Date(baseDate);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const END_OFFSETS = [-42, -8, 0, 5, 12, 28, 65, 110, 180, 260];
const RTM_OFFSETS = [-80, -3, 3, 11, 35, 75, 95, 150, 220, 320];
const LICENSE_OFFSETS = [-25, 2, 9, 40, 70, 100, 150, 210, 300, 420];

const withDocumentState = (document, expirationField, referenceDate) => {
  const diasRestantes = calculateDaysRemaining(document[expirationField], referenceDate);
  return {
    ...document,
    id: document.id || document._id,
    diasRestantes,
    estado: calculateDocumentState(diasRestantes, WARNING_THRESHOLD),
  };
};

export function buildDemoData(referenceDate = new Date().toISOString().slice(0, 10)) {
  const sample = buildSampleBackupPayload();
  const baseDate = new Date(`${referenceDate}T12:00:00`);
  const vehicleIdByPlate = new Map(
    sample.vehiculos.map((vehicle, index) => [vehicle.placa, `demo-vehicle-${index + 1}`])
  );

  const conductores = sample.conductores.map((conductor, index) => withDocumentState({
    ...conductor,
    id: `demo-driver-${index + 1}`,
    fechaVencimiento: toIsoDate(baseDate, LICENSE_OFFSETS[index]),
  }, 'fechaVencimiento', referenceDate));

  const soats = sample.soats.slice(0, 9).map((soat, index) => withDocumentState({
    ...soat,
    id: `soat-${index + 1}`,
    vehiculoId: vehicleIdByPlate.get(soat.placaVehiculo),
    fechaInicioVigencia: toIsoDate(baseDate, END_OFFSETS[index] - 365),
    fechaFinVigencia: toIsoDate(baseDate, END_OFFSETS[index]),
  }, 'fechaFinVigencia', referenceDate));

  const rtms = sample.rtms.slice(0, 9).map((rtm, index) => withDocumentState({
    ...rtm,
    id: `rtm-${index + 1}`,
    vehiculoId: vehicleIdByPlate.get(rtm.placaVehiculo),
    fechaExpedicion: toIsoDate(baseDate, RTM_OFFSETS[index] - 365),
    fechaVencimiento: toIsoDate(baseDate, RTM_OFFSETS[index]),
  }, 'fechaVencimiento', referenceDate));

  const conductorByDocument = new Map(conductores.map((item) => [String(item.documento), item]));
  const soatByVehicle = new Map(soats.map((item) => [String(item.vehiculoId), item]));
  const rtmByVehicle = new Map(rtms.map((item) => [String(item.vehiculoId), item]));

  const vehiculos = sample.vehiculos.map((vehicle, index) => {
    const id = `demo-vehicle-${index + 1}`;
    const conductor = conductorByDocument.get(String(vehicle.conductorDocumento));
    const soat = soatByVehicle.get(String(id));
    const rtm = rtmByVehicle.get(String(id));
    const estadoGeneral = getWorstState(
      getWorstState(conductor?.estado || 'rojo', soat?.estado || 'rojo'),
      rtm?.estado || 'rojo'
    );
    const enriched = {
      ...vehicle,
      id,
      ownerLabel: 'Transportes Horizonte Demo',
      conductorId: conductor?.id || null,
      conductor,
      soat,
      rtm,
      estadoGeneral,
    };
    const summary = getVehicleStatusSummary(enriched);
    return { ...enriched, estadoRazon: summary.reason, estadoRazones: summary.reasons };
  });

  const alerts = alertSorter.sort([
    ...soatAdapter.adaptMany(soats),
    ...rtmAdapter.adaptMany(rtms),
    ...conductorAdapter.adaptMany(conductores),
    ...vehicleAdapter.adaptMany(vehiculos),
  ]);

  return {
    referenceDate,
    readOnly: true,
    vehiculos,
    conductores,
    soats,
    rtms,
    alerts,
    qualityMetrics: buildQualityMetricsSummary({
      vehicles: vehiculos,
      conductors: conductores,
      soats,
      rtms,
      alerts,
    }),
  };
}

const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function buildDemoCsv({ vehiculos = [] } = {}) {
  const headers = [
    'Placa',
    'Marca',
    'Modelo',
    'Tipo',
    'Conductor',
    'Estado SOAT',
    'Estado RTM',
    'Estado general',
  ];
  const rows = vehiculos.map((vehicle) => [
    vehicle.placa,
    vehicle.marca,
    vehicle.modelo,
    vehicle.tipo,
    vehicle.conductor?.nombre || 'Sin asignar',
    vehicle.soat?.estado || 'Sin registro',
    vehicle.rtm?.estado || 'Sin registro',
    vehicle.estadoGeneral,
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');
}

export function downloadDemoCsv(data, fileName = 'drivecontrol-demo.csv') {
  const blob = new Blob([`\uFEFF${buildDemoCsv(data)}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
