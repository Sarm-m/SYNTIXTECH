import { useEffect, useMemo, useState } from 'react';
import { useAlertHub } from './useAlertHub.js';
import { useVehicles } from './useVehicles.js';
import { useConductors } from './useConductors.js';
import { useDocuments } from './useDocuments.js';
import { useRtm } from '@/contexts/RtmContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import SoatAlertAdapter from '@/patterns/adapters/SoatAlertAdapter.js';
import RtmAlertAdapter from '@/patterns/adapters/RtmAlertAdapter.js';
import ConductorAlertAdapter from '@/patterns/adapters/ConductorAlertAdapter.js';
import VehicleAlertAdapter from '@/patterns/adapters/VehicleAlertAdapter.js';
import PriorityAlertSortStrategy from '@/patterns/strategy/PriorityAlertSortStrategy.js';
import UrgencyAlertSortStrategy from '@/patterns/strategy/UrgencyAlertSortStrategy.js';
import { isValidPlate, normalizePlate } from '@/utils/colombiaFormats.js';
import AlertHubSingleton from '@/patterns/singleton/AlertHubSingleton.js';

const soatAlertAdapter = new SoatAlertAdapter();
const rtmAlertAdapter = new RtmAlertAdapter();
const conductorAlertAdapter = new ConductorAlertAdapter();
const vehicleAlertAdapter = new VehicleAlertAdapter();

const UNKNOWN_VEHICLE_LABEL = 'Vehiculo no encontrado';
const alertHub = AlertHubSingleton.getInstance();

let lastAlertsUserEmail = null;

const resolveVehiclePlate = (documento, vehiculos = []) => {
  const vehiculo = vehiculos.find(
    (item) => String(documento.vehiculoId) === String(item._id || item.id)
  );

  const placa = normalizePlate(vehiculo?.placa || documento.placaVehiculo || documento.vehiculoPlaca || documento.placa || '');

  return isValidPlate(placa) ? placa : UNKNOWN_VEHICLE_LABEL;
};

const enrichDocumentWithVehicle = (documento, vehiculos) => {
  const placa = resolveVehiclePlate(documento, vehiculos);

  return {
    ...documento,
    placa,
    placaVehiculo: placa,
    vehiculoPlaca: placa,
  };
};

// La fachada publica alertas en el hub global sin limpiar estado al desmontar vistas.
export function useAlertsFacade(sortMode = 'priority') {
  const { user } = useAuth();
  const { soats, loading: documentsLoading } = useDocuments();
  const { rtms, loading: rtmLoading } = useRtm();
  const { vehiculos, isLoading: vehiclesLoading } = useVehicles();
  const { conductores, isLoading: conductorsLoading } = useConductors();

  const {
    alerts,
    registerAllSources,
    setSortStrategy,
  } = useAlertHub();

  const isLoading = documentsLoading || rtmLoading || vehiclesLoading || conductorsLoading;
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setHasLoadedOnce(false);
      return;
    }

    if (!isLoading) {
      setHasLoadedOnce(true);
    }
  }, [isLoading, user?.email]);

  const isReady = Boolean(user?.email) && hasLoadedOnce;
  const isInitialLoading = isLoading && !hasLoadedOnce;

  const enrichedSoats = useMemo(
    () => soats.map((soat) => enrichDocumentWithVehicle(soat, vehiculos)),
    [soats, vehiculos]
  );

  const enrichedRtms = useMemo(
    () => rtms.map((rtm) => enrichDocumentWithVehicle(rtm, vehiculos)),
    [rtms, vehiculos]
  );

  const sourceAlerts = useMemo(() => {
    if (!isReady) {
      return null;
    }

    return {
      soats: soatAlertAdapter.adaptMany(enrichedSoats),
      rtms: rtmAlertAdapter.adaptMany(enrichedRtms),
      conductores: conductorAlertAdapter.adaptMany(conductores),
      vehiculos: vehicleAlertAdapter.adaptMany(vehiculos),
    };
  }, [isReady, enrichedSoats, enrichedRtms, conductores, vehiculos]);

  useEffect(() => {
    const nextEmail = user?.email || null;

    if (!nextEmail) {
      if (lastAlertsUserEmail !== null) {
        alertHub.reset();
        lastAlertsUserEmail = null;
      }
      return;
    }

    if (lastAlertsUserEmail !== nextEmail) {
      alertHub.reset();
      lastAlertsUserEmail = nextEmail;
    }
  }, [user?.email]);

  useEffect(() => {
    if (!sourceAlerts) {
      return;
    }

    registerAllSources(sourceAlerts);
  }, [sourceAlerts, registerAllSources]);

  useEffect(() => {
    const strategy =
      sortMode === 'urgency'
        ? new UrgencyAlertSortStrategy()
        : new PriorityAlertSortStrategy();

    setSortStrategy(strategy);
  }, [sortMode, setSortStrategy]);

  const criticalAlerts = useMemo(
    () => alerts.filter((alert) => alert.prioridad === 'rojo'),
    [alerts]
  );

  const warningAlerts = useMemo(
    () => alerts.filter((alert) => alert.prioridad === 'amarillo'),
    [alerts]
  );

  const totalActiveAlerts = isReady ? alerts.length : 0;

  return {
    alerts: isReady ? alerts : [],
    totalAlerts: totalActiveAlerts,
    totalActiveAlerts,
    criticalAlerts: isReady ? criticalAlerts : [],
    warningAlerts: isReady ? warningAlerts : [],
    isLoading: isInitialLoading,
    isReady,
  };
}
