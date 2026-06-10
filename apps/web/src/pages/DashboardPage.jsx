import React from 'react';
import { Helmet } from 'react-helmet';
import DashboardView from '@/components/DashboardView.jsx';
import ModalFactory from '@/components/ModalFactory.jsx';
import useModalManager from '@/hooks/useModalManager.js';
import { useVehicles } from '@/hooks/useVehicles.js';
import { useConductors } from '@/hooks/useConductors.js';
import { useDocuments } from '@/hooks/useDocuments.js';
import { useRtm } from '@/contexts/RtmContext.jsx';
import { useAlerts } from '@/hooks/useAlerts.js';

export default function DashboardPage() {
  const {
    vehiculos,
    isLoading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useVehicles();
  const {
    conductores,
    isLoading: conductorsLoading,
    error: conductorsError,
    refetch: refetchConductors,
  } = useConductors();
  const {
    soats,
    loading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments();
  const {
    rtms,
    loading: rtmLoading,
    error: rtmError,
    refetch: refetchRtms,
  } = useRtm();
  const { alerts, isLoading: alertsLoading } = useAlerts();
  const { activeModal, openModal, closeModal } = useModalManager();
  const error = [vehiclesError, conductorsError, documentsError, rtmError].filter(Boolean).join(' ');
  const retry = () => Promise.all([
    refetchVehicles(),
    refetchConductors(),
    refetchDocuments(),
    refetchRtms(),
  ]);

  return (
    <>
      <Helmet><title>Dashboard | DriveControl</title></Helmet>
      <DashboardView
        vehiculos={vehiculos}
        conductores={conductores}
        soats={soats}
        rtms={rtms}
        alerts={alerts}
        isLoading={vehiclesLoading || conductorsLoading || documentsLoading || rtmLoading || alertsLoading}
        error={error}
        onRetry={retry}
        onAddVehicle={() => openModal('addVehicle')}
        onAddConductor={() => openModal('addConductor')}
        onAddSoat={() => openModal('addDocument')}
        onAddRtm={() => openModal('addRtm')}
      />
      <ModalFactory modalType={activeModal} onClose={closeModal} />
    </>
  );
}
