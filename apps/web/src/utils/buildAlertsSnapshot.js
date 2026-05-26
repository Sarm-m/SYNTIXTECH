import SoatAlertAdapter from '@/patterns/adapters/SoatAlertAdapter.js';
import RtmAlertAdapter from '@/patterns/adapters/RtmAlertAdapter.js';
import ConductorAlertAdapter from '@/patterns/adapters/ConductorAlertAdapter.js';
import VehicleAlertAdapter from '@/patterns/adapters/VehicleAlertAdapter.js';
import PriorityAlertSortStrategy from '@/patterns/strategy/PriorityAlertSortStrategy.js';
import { buildAlertSignature } from '@/utils/alertSignature.js';

const soatAlertAdapter = new SoatAlertAdapter();
const rtmAlertAdapter = new RtmAlertAdapter();
const conductorAlertAdapter = new ConductorAlertAdapter();
const vehicleAlertAdapter = new VehicleAlertAdapter();
const defaultSortStrategy = new PriorityAlertSortStrategy();

const mergeUniqueAlerts = (alertGroups = []) => {
  const merged = [];
  const seen = new Set();

  alertGroups.flat().forEach((alert) => {
    if (!alert?.id || seen.has(alert.id)) return;
    seen.add(alert.id);
    merged.push(alert);
  });

  return merged;
};

export const buildAlertsSnapshot = ({
  soats = [],
  rtms = [],
  conductores = [],
  vehiculos = [],
  sortStrategy = defaultSortStrategy,
} = {}) => {
  const soatAlerts = soatAlertAdapter.adaptMany(soats);
  const rtmAlerts = rtmAlertAdapter.adaptMany(rtms);
  const conductorAlerts = conductorAlertAdapter.adaptMany(conductores);
  const vehicleAlerts = vehicleAlertAdapter.adaptMany(vehiculos);

  const alerts = sortStrategy.sort(
    mergeUniqueAlerts([soatAlerts, rtmAlerts, conductorAlerts, vehicleAlerts])
  );

  const countsBySeverity = alerts.reduce(
    (acc, alert) => {
      if (alert.prioridad === 'rojo') acc.rojo += 1;
      if (alert.prioridad === 'amarillo') acc.amarillo += 1;
      return acc;
    },
    { rojo: 0, amarillo: 0 }
  );

  const countsByCategory = alerts.reduce((acc, alert) => {
    const category = alert.categoria || 'otros';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return {
    alerts,
    totalActiveAlerts: alerts.length,
    countsBySeverity,
    countsByCategory,
    signature: buildAlertSignature(alerts),
  };
};
