import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Calendar,
  Car,
  CheckCircle2,
  FilePenLine,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AddConductorModal from '@/components/AddConductorModal.jsx';
import EditRtmModal from '@/components/EditRtmModal.jsx';
import EditSoatModal from '@/components/EditSoatModal.jsx';
import ModalFactory from '@/components/ModalFactory.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import {
  EmptyState,
  LoadingState,
  MetricCard,
  PageHeader,
  SurfaceCard,
} from '@/components/UI/SaasUI.jsx';
import { useConductors } from '@/hooks/useConductors.js';
import { useAlerts } from '@/hooks/useAlerts.js';
import { useDocuments } from '@/hooks/useDocuments.js';
import useModalManager from '@/hooks/useModalManager.js';
import { useSimulatedDate } from '@/hooks/useSimulatedDate.js';
import { useRtm } from '@/contexts/RtmContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import {
  getAlertActionModel,
  getAlertPresentation,
  getAlertsSummary,
  getAlertSourceId,
} from '@/utils/alertActions.js';

const alertSections = [
  {
    id: 'vehiculos',
    title: 'Vehículos',
    description: 'SOAT y revisiones técnico-mecánicas que requieren gestión.',
    icon: Car,
    groups: [
      {
        key: 'SOAT',
        title: 'SOAT',
        description: 'Pólizas faltantes, vencidas o próximas a vencer.',
        icon: ShieldCheck,
      },
      {
        key: 'RTM',
        title: 'RTM',
        description: 'Revisiones técnico-mecánicas que requieren seguimiento.',
        icon: Wrench,
      },
    ],
  },
  {
    id: 'conductores',
    title: 'Conductores',
    description: 'Licencias y asignaciones que necesitan atención operativa.',
    icon: Users,
    groups: [
      {
        key: 'Licencias',
        title: 'Licencias',
        description: 'Vigencias de licencia y conductores pendientes de asignación.',
        icon: Users,
      },
    ],
  },
];

const alertShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  categoria: PropTypes.string,
  grupo: PropTypes.string,
  tipo: PropTypes.string,
  prioridad: PropTypes.string,
  mensaje: PropTypes.string,
  reason: PropTypes.string,
  entidad: PropTypes.string,
  diasRestantes: PropTypes.number,
  fechaVencimiento: PropTypes.string,
});

export default function AlertasPage() {
  const { alerts, isReady, isLoading } = useAlerts();
  const { soats } = useDocuments();
  const { rtms } = useRtm();
  const { conductores } = useConductors();
  const { simulatedDate, setSimulatedDate, resetDate } = useSimulatedDate();
  const { activeModal, openModal, closeModal } = useModalManager();
  const [soatToEdit, setSoatToEdit] = useState(null);
  const [rtmToEdit, setRtmToEdit] = useState(null);
  const [conductorToEdit, setConductorToEdit] = useState(null);

  const handleAlertAction = (alert, actionKind) => {
    if (actionKind === 'register-soat') openModal('addDocument');
    if (actionKind === 'register-rtm') openModal('addRtm');
    if (actionKind === 'update-soat') {
      setSoatToEdit(soats.find((item) => String(item.id) === getAlertSourceId(alert, 'soat-')) || null);
    }
    if (actionKind === 'update-rtm') {
      setRtmToEdit(rtms.find((item) => String(item.id) === getAlertSourceId(alert, 'rtm-')) || null);
    }
    if (actionKind === 'update-license') {
      setConductorToEdit(conductores.find((item) => String(item.id) === getAlertSourceId(alert, 'lic-')) || null);
    }
  };

  return (
    <>
      <AlertsCenterView
        alerts={isReady ? alerts : []}
        isLoading={isLoading}
        simulatedDate={simulatedDate}
        onSimulatedDateChange={setSimulatedDate}
        onResetDate={resetDate}
        onAlertAction={handleAlertAction}
      />
      <ModalFactory modalType={activeModal} onClose={closeModal} />
      <EditSoatModal isOpen={Boolean(soatToEdit)} soat={soatToEdit} onClose={() => setSoatToEdit(null)} />
      <EditRtmModal isOpen={Boolean(rtmToEdit)} rtm={rtmToEdit} onClose={() => setRtmToEdit(null)} />
      <AddConductorModal
        isOpen={Boolean(conductorToEdit)}
        conductorToEdit={conductorToEdit}
        onClose={() => setConductorToEdit(null)}
      />
    </>
  );
}

export function AlertsCenterView({
  alerts,
  isLoading = false,
  basePath = '',
  readOnly = false,
  simulatedDate,
  onSimulatedDateChange,
  onResetDate,
  onAlertAction,
}) {
  const { isDarkMode } = useTheme();
  const to = (path) => `${basePath}${path}`;
  const summary = useMemo(() => getAlertsSummary(alerts), [alerts]);
  const groupedAlerts = useMemo(() => alerts.reduce((groups, alert) => {
    const key = `${alert.categoria || 'general'}:${alert.grupo || alert.tipo || 'General'}`;
    groups[key] = [...(groups[key] || []), alert];
    return groups;
  }, {}), [alerts]);
  const hasDateSimulator = Boolean(simulatedDate && onSimulatedDateChange && onResetDate);

  const dateSimulator = hasDateSimulator ? (
    <div data-onboarding="alerts-date-filter" className={`flex w-full items-center gap-3 rounded-xl border p-2 shadow-sm sm:w-auto ${
      isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
    }`}>
      <Calendar className={`ml-1 h-5 w-5 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
      <div className="min-w-0 flex-1">
        <label htmlFor="alerts-simulated-date" className={`block text-[10px] font-bold uppercase tracking-wider ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>Simular fecha</label>
        <input
          id="alerts-simulated-date"
          type="date"
          value={simulatedDate}
          onChange={(event) => onSimulatedDateChange(event.target.value)}
          className={`w-full bg-transparent text-sm font-semibold outline-none ${
            isDarkMode ? 'text-slate-100' : 'text-syntix-navy'
          }`}
          style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
        />
      </div>
      <button type="button" data-onboarding="alerts-reset-date" onClick={onResetDate} className="btn-ghost min-h-9 px-3 py-1 text-xs">
        Hoy
      </button>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <Helmet><title>{readOnly ? 'Alertas | Demo DriveControl' : 'Alertas | DriveControl'}</title></Helmet>

      <div data-onboarding="alerts-header">
        <PageHeader
          eyebrow={readOnly ? 'Demo de producto' : 'Gestión preventiva'}
          title="Centro de Alertas"
          description="Prioriza documentos faltantes, vencimientos críticos y acciones preventivas de la flota."
          actions={dateSimulator}
        />
      </div>

      {isLoading ? (
        <LoadingState label="Organizando alertas de la flota..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard icon={AlertTriangle} label="Críticas" value={summary.critical} hint="Requieren atención inmediata" tone="red" />
            <MetricCard icon={BellRing} label="Preventivas" value={summary.preventive} hint="Conviene gestionarlas pronto" tone="amber" />
            <MetricCard icon={Car} label="Vehículos afectados" value={summary.vehicles} hint="Unidades con alertas activas" tone="navy" />
            <MetricCard icon={Users} label="Conductores afectados" value={summary.conductors} hint="Licencias o asignaciones" tone="blue" />
          </div>

          {alerts.length === 0 && (
            <SurfaceCard className="p-4">
              <EmptyState
                icon={CheckCircle2}
                title="La flota no tiene alertas activas"
                description="Los documentos y licencias monitoreados se encuentran al día para la fecha seleccionada."
                compact
              />
            </SurfaceCard>
          )}

          <div data-onboarding="alerts-list" className="space-y-6">
            {alertSections.map((section) => (
              <AlertSection
                key={section.id}
                section={section}
                groupedAlerts={groupedAlerts}
                basePath={basePath}
                readOnly={readOnly}
                onAlertAction={onAlertAction}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AlertSection({ section, groupedAlerts, basePath, readOnly, onAlertAction, isDarkMode }) {
  const sectionAlerts = section.groups.flatMap((group) => groupedAlerts[`${section.id}:${group.key}`] || []);
  const Icon = section.icon;

  return (
    <SurfaceCard className="overflow-hidden">
      <div className={`flex items-start justify-between gap-4 border-b px-4 py-5 sm:px-6 ${
        isDarkMode ? 'border-slate-800 bg-slate-950/45' : 'border-slate-100 bg-slate-50/60'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`rounded-xl p-2.5 ${isDarkMode ? 'bg-slate-800 text-blue-300' : 'bg-white text-syntix-navy shadow-sm'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{section.title}</h2>
            <p className={`mt-1 text-xs leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{section.description}</p>
          </div>
        </div>
        <StatusBadge status={sectionAlerts.length ? 'pendiente' : 'verde'} label={`${sectionAlerts.length} activas`} />
      </div>

      <div className={`grid grid-cols-1 gap-4 p-4 sm:p-6 ${section.groups.length > 1 ? 'xl:grid-cols-2' : ''}`}>
        {section.groups.map((group) => (
          <AlertGroup
            key={`${section.id}:${group.key}`}
            group={group}
            alerts={groupedAlerts[`${section.id}:${group.key}`] || []}
            basePath={basePath}
            readOnly={readOnly}
            onAlertAction={onAlertAction}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </SurfaceCard>
  );
}

function AlertGroup({ group, alerts, basePath, readOnly, onAlertAction, isDarkMode }) {
  const Icon = group.icon;

  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${
      isDarkMode ? 'border-slate-800 bg-slate-950/35' : 'border-slate-200/80 bg-slate-50/55'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl p-2 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-syntix-navy shadow-sm'}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{group.title}</h3>
            <p className={`mt-1 text-xs leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{group.description}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
          isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 shadow-sm'
        }`}>{alerts.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className={`rounded-xl border border-dashed p-5 text-center ${
            isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white/80'
          }`}>
            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
            <p className={`mt-2 text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Sin alertas en este grupo</p>
            <p className="mt-1 text-xs text-slate-500">No hay acciones pendientes por ahora.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              basePath={basePath}
              readOnly={readOnly}
              onAlertAction={onAlertAction}
              isDarkMode={isDarkMode}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AlertCard({ alert, basePath, readOnly, onAlertAction, isDarkMode }) {
  const presentation = getAlertPresentation(alert);
  const actions = getAlertActionModel(alert);
  const isCritical = alert.prioridad === 'rojo';
  const accentClass = isCritical ? 'border-l-red-500' : 'border-l-amber-500';
  const iconClass = isCritical
    ? 'bg-red-500/10 text-red-500 dark:text-red-400'
    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  const to = (path) => `${basePath}${path}`;
  const shouldUseButton = !readOnly && actions.primary.canMutate && onAlertAction;

  return (
    <article className={`rounded-xl border border-l-4 p-4 shadow-sm ${accentClass} ${
      isDarkMode ? 'border-y-slate-800 border-r-slate-800 bg-slate-900' : 'border-y-slate-200 border-r-slate-200 bg-white'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-xl p-2 ${iconClass}`}><BellRing className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{presentation.title}</p>
              <p className={`mt-1 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {alert.grupo || alert.tipo}
              </p>
            </div>
            <StatusBadge status={alert.prioridad} label={isCritical ? 'Crítica' : 'Preventiva'} />
          </div>
          <p className={`mt-3 text-sm leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{presentation.description}</p>
          <p className={`mt-2 text-xs font-semibold leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{presentation.guidance}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {shouldUseButton ? (
          <button type="button" onClick={() => onAlertAction(alert, actions.primary.kind)} className="btn-primary min-h-10 px-3 text-xs">
            <FilePenLine className="h-4 w-4" /> {actions.primary.label}
          </button>
        ) : (
          <Link to={to(actions.primary.route)} className="btn-primary min-h-10 px-3 text-xs">
            {actions.primary.label} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link to={to(actions.secondary.route)} className="btn-secondary min-h-10 px-3 text-xs">
          {actions.secondary.label}
        </Link>
      </div>
    </article>
  );
}

AlertsCenterView.propTypes = {
  alerts: PropTypes.arrayOf(alertShape).isRequired,
  isLoading: PropTypes.bool,
  basePath: PropTypes.string,
  readOnly: PropTypes.bool,
  simulatedDate: PropTypes.string,
  onSimulatedDateChange: PropTypes.func,
  onResetDate: PropTypes.func,
  onAlertAction: PropTypes.func,
};

AlertSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  groupedAlerts: PropTypes.object.isRequired,
  basePath: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onAlertAction: PropTypes.func,
  isDarkMode: PropTypes.bool.isRequired,
};

AlertGroup.propTypes = {
  group: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,
  alerts: PropTypes.arrayOf(alertShape).isRequired,
  basePath: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onAlertAction: PropTypes.func,
  isDarkMode: PropTypes.bool.isRequired,
};

AlertCard.propTypes = {
  alert: alertShape.isRequired,
  basePath: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onAlertAction: PropTypes.func,
  isDarkMode: PropTypes.bool.isRequired,
};
