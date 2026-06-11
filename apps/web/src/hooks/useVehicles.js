import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/services/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useConductors } from './useConductors.js';
import { useDocuments } from './useDocuments.js';
import { useRtm } from '@/contexts/RtmContext.jsx';
import { getVehicleStatusSummary, getWorstState } from '@/utils/dateUtils.js';
import { normalizePlate } from '@/utils/colombiaFormats.js';

const VEHICLES_UPDATED_EVENT = 'syntix:vehicles-updated';

// Normaliza el shape de salida del backend para que el resto del frontend trate todos los vehículos igual.
const normalizeVehicle = (vehiculo) => ({
  ...vehiculo,
  id: vehiculo._id || vehiculo.id,
  placa: normalizePlate(vehiculo.placa),
  tipo: vehiculo.tipo || 'Otro',
});

const notifyVehiclesUpdated = () => {
  if (typeof globalThis !== 'undefined' && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new Event(VEHICLES_UPDATED_EVENT));
  }
};

export function useVehicles() {
  const [vehiculos, setVehiculos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { conductores } = useConductors();
  const { soats } = useDocuments();
  const { rtms } = useRtm();

  const fetchVehicles = useCallback(async () => {
    if (!user?.email) {
      setVehiculos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/vehiculos');

      setVehiculos(res.data.map(normalizeVehicle));
    } catch (err) {
      console.error('Error cargando vehiculos', err);
      setError('No pudimos cargar los vehículos. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    // La lista depende del usuario porque el backend filtra por ownerEmail.
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !globalThis.addEventListener) return undefined;

    // Este listener permite refrescar la flota desde cualquier mutación disparada en otro módulo.
    const handleVehiclesUpdated = () => {
      fetchVehicles();
    };

    globalThis.addEventListener(VEHICLES_UPDATED_EVENT, handleVehiclesUpdated);
    return () => globalThis.removeEventListener(VEHICLES_UPDATED_EVENT, handleVehiclesUpdated);
  }, [fetchVehicles]);

  const addVehicle = async (data) => {
    if (!user?.email) {
      throw new Error('No hay usuario autenticado');
    }

    const response = await api.post('/vehiculos', {
      ...data,
      placa: normalizePlate(data.placa),
      anio: Number(data.anio),
      tipo: data.tipo || 'Otro',
      conductorId: data.conductorId ?? null,
      ownerEmail: user.email,
      ownerEmpresa: user.empresa || '',
    });

    await fetchVehicles();
    notifyVehiclesUpdated();

    return normalizeVehicle(response.data);
  };

  const updateVehicle = async (id, data) => {
    const response = await api.put(`/vehiculos/${id}`, {
      ...data,
      placa: normalizePlate(data.placa),
      anio: Number(data.anio),
      tipo: data.tipo || 'Otro',
    });

    await fetchVehicles();
    notifyVehiclesUpdated();

    return normalizeVehicle(response.data);
  };

  const deleteVehicle = async (id) => {
    await api.delete(`/vehiculos/${id}`);
    await fetchVehicles();
    notifyVehiclesUpdated();
  };

  const assignConductor = async (vehicleId, conductorId) => {
    const response = await api.put(`/vehiculos/${vehicleId}/conductor`, {
      conductorId: conductorId || null,
    });

    await fetchVehicles();
    notifyVehiclesUpdated();

    return normalizeVehicle(response.data);
  };

  const vehiculosCompletos = useMemo(() => {
    const conductorById = new Map(conductores.map((item) => [String(item.id), item]));
    const soatByVehicleId = new Map(soats.map((item) => [String(item.vehiculoId), item]));
    const rtmByVehicleId = new Map(rtms.map((item) => [String(item.vehiculoId), item]));

    return vehiculos.map((vehiculo) => {
      // Aquí se arma la visión "enriquecida" que consumen las pantallas:
      // vehículo + conductor + documentos + severidad consolidada.
      const conductor = conductorById.get(String(vehiculo.conductorId));
      const soat = soatByVehicleId.get(String(vehiculo.id));
      const rtm = rtmByVehicleId.get(String(vehiculo.id));
      const estadoConductor = vehiculo.conductorId ? conductor?.estado || 'rojo' : 'rojo';
      const estadoSoat = soat?.estado || 'rojo';
      const estadoRtm = rtm?.estado || 'rojo';

      const estadoGeneral = getWorstState(getWorstState(estadoConductor, estadoSoat), estadoRtm);
      const vehicleWithState = {
        ...vehiculo,
        conductor,
        soat,
        rtm,
        ownerLabel: vehiculo.ownerEmpresa || user?.empresa || vehiculo.ownerEmail || 'Sin dato',
        estadoGeneral,
      };
      const statusSummary = getVehicleStatusSummary(vehicleWithState);

      return {
        ...vehicleWithState,
        estadoRazon: statusSummary.reason,
        estadoRazones: statusSummary.reasons,
        estadoLabel: statusSummary.label,
      };
    });
  }, [vehiculos, conductores, soats, rtms, user?.empresa]);

  return {
    vehiculos: vehiculosCompletos,
    isLoading,
    error,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignConductor,
    fetchVehicles,
    refetch: fetchVehicles,
  };
}
