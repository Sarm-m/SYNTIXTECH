import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Car,
  FilePlus2,
  FileText,
  Plus,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
  SurfaceCard,
} from '@/components/UI/SaasUI.jsx';
import { formatColombianDate } from '@/utils/dateUtils.js';
import { useTheme } from '@/contexts/ThemeContext.jsx';

export default function DashboardView({
  vehiculos,
  conductores,
  soats,
  rtms,
  alerts,
  isLoading = false,
  error = '',
  onRetry,
  readOnly = false,
  basePath = '',
  onAddVehicle,
  onAddConductor,
  onAddSoat,
  onAddRtm,
}) {
  const { isDarkMode } = useTheme();
  const to = (path) => `${basePath}${path}`;
  const recommendation = useMemo(() => getRecommendedAction(alerts), [alerts]);

  const metrics = useMemo(() => [
    { label: 'Vehículos registrados', value: vehiculos.length, hint: 'Unidades bajo control', icon: Car, tone: 'navy' },
    { label: 'Conductores activos', value: conductores.length, hint: 'Licencias monitoreadas', icon: Users, tone: 'blue' },
    { label: 'SOAT próximos a vencer', value: soats.filter((item) => item.estado === 'amarillo').length, hint: 'Requieren prevención', icon: ShieldCheck, tone: 'amber' },
    { label: 'RTM próximas a vencer', value: rtms.filter((item) => item.estado === 'amarillo').length, hint: 'Requieren prevención', icon: Wrench, tone: 'amber' },
    { label: 'Alertas críticas', value: alerts.filter((item) => item.prioridad === 'rojo').length, hint: 'Requieren atención', icon: AlertTriangle, tone: 'red' },
  ], [alerts, conductores, rtms, soats, vehiculos]);

  const upcoming = useMemo(
    () => alerts
      .filter((alert) => alert.prioridad === 'amarillo')
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 5),
    [alerts]
  );
  const critical = useMemo(
    () => alerts.filter((alert) => alert.prioridad === 'rojo').slice(0, 5),
    [alerts]
  );

  const actions = (
    <div data-onboarding="dashboard-header-actions" className="flex flex-wrap gap-2 sm:justify-end">
      <button type="button" onClick={onAddVehicle} data-onboarding="dashboard-action-add-vehicle" className="btn-primary">
        <Plus className="h-4 w-4" /> Agregar vehículo
      </button>
      <button type="button" onClick={onAddConductor} data-onboarding="dashboard-action-add-conductor" className="btn-secondary">
        <Users className="h-4 w-4" /> Agregar conductor
      </button>
      <button type="button" onClick={onAddSoat} data-onboarding="dashboard-action-add-soat" className="btn-secondary">
        <FilePlus2 className="h-4 w-4" /> Registrar SOAT
      </button>
      <button type="button" onClick={onAddRtm} data-onboarding="dashboard-action-add-rtm" className="btn-secondary">
        <Wrench className="h-4 w-4" /> Registrar RTM
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div data-onboarding="dashboard-summary">
        <PageHeader
          eyebrow={readOnly ? 'Vista demostrativa' : 'Centro de control'}
          title="Estado general de la flota"
          description="Prioriza vencimientos, documentos faltantes y acciones operativas desde una sola vista."
          actions={actions}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <>
          <RecommendedActionCard
            recommendation={recommendation}
            to={to}
            isDarkMode={isDarkMode}
            onAddSoat={onAddSoat}
            onAddRtm={onAddRtm}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SurfaceCard className="overflow-hidden">
              <SectionHeading
                icon={BellRing}
                title="Próximos vencimientos"
                description="Documentos que conviene renovar antes de convertirse en una alerta crítica."
                link={to('/alertas')}
                isDarkMode={isDarkMode}
              />
              <div className="p-4 sm:p-5">
                {upcoming.length === 0 ? (
                  <EmptyState
                    compact
                    icon={ShieldCheck}
                    title="No hay documentos próximos a vencer"
                    description="La flota no tiene vencimientos preventivos dentro del umbral configurado."
                    actionLabel="Revisar documentos"
                    actionTo={to('/documentos')}
                  />
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((alert) => <AlertRow key={alert.id} alert={alert} isDarkMode={isDarkMode} />)}
                  </div>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard className="overflow-hidden">
              <SectionHeading
                icon={AlertTriangle}
                title="Atención prioritaria"
                description="Riesgos críticos que requieren gestión inmediata."
                link={to('/alertas')}
                isDarkMode={isDarkMode}
              />
              <div className="p-4 sm:p-5">
                {critical.length === 0 ? (
                  <EmptyState
                    compact
                    icon={ShieldCheck}
                    title="No hay alertas críticas"
                    description="La documentación crítica de la flota se encuentra bajo control."
                  />
                ) : (
                  <div className="space-y-3">
                    {critical.map((alert) => <AlertRow key={alert.id} alert={alert} isDarkMode={isDarkMode} />)}
                  </div>
                )}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard className="overflow-hidden">
            <SectionHeading
              icon={FileText}
              title="Accesos operativos"
              description="Entra directamente al módulo que necesitas gestionar."
              isDarkMode={isDarkMode}
            />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
              <QuickLink to={to('/vehiculos')} icon={Car} title="Vehículos" description="Inventario y estado general" isDarkMode={isDarkMode} />
              <QuickLink to={to('/conductores')} icon={Users} title="Conductores" description="Licencias y asignaciones" isDarkMode={isDarkMode} />
              <QuickLink to={to('/documentos')} icon={ShieldCheck} title="Documentos" description="SOAT y revisión técnico-mecánica" isDarkMode={isDarkMode} />
              <QuickLink to={to('/reportes')} icon={FileText} title="Reportes" description="Indicadores y exportación" isDarkMode={isDarkMode} />
            </div>
          </SurfaceCard>
        </>
      )}
    </div>
  );
}

export function getRecommendedAction(alerts = []) {
  const sortByUrgency = (a, b) => {
    const aDays = Number.isFinite(a?.diasRestantes) ? a.diasRestantes : Number.POSITIVE_INFINITY;
    const bDays = Number.isFinite(b?.diasRestantes) ? b.diasRestantes : Number.POSITIVE_INFINITY;
    return aDays - bDays;
  };
  const critical = alerts.filter((alert) => alert.prioridad === 'rojo').sort(sortByUrgency);

  if (critical.length > 0) {
    return {
      tone: 'critical',
      title: 'Hay alertas críticas que requieren revisión inmediata.',
      description: buildRecommendationDetail(critical, 'critical'),
      alert: critical[0],
      count: critical.length,
    };
  }

  const preventive = alerts.filter((alert) => alert.prioridad === 'amarillo').sort(sortByUrgency);
  if (preventive.length > 0) {
    return {
      tone: 'preventive',
      title: 'El próximo vencimiento requiere seguimiento preventivo.',
      description: buildRecommendationDetail(preventive, 'preventive'),
      alert: preventive[0],
      count: preventive.length,
    };
  }

  return {
    tone: 'positive',
    title: 'La flota no tiene alertas activas en este momento.',
    description: 'Mantén actualizados los documentos para conservar este estado.',
    alert: null,
    count: 0,
  };
}

export function buildRecommendationDetail(alerts = [], tone = 'critical') {
  const uniqueTopics = [...new Set(alerts.map((alert) => alert.grupo || alert.tipo).filter(Boolean))].slice(0, 2);
  const uniqueEntities = [...new Set(alerts.map((alert) => String(alert.entidad || '').replace(/^Vehiculo\b/i, 'Vehículo')).filter(Boolean))];
  const count = alerts.length;
  const topicText = uniqueTopics.length > 0 ? uniqueTopics.join(' y ') : 'documentos';
  const entityText = uniqueEntities.length === 1 ? ` para ${uniqueEntities[0]}` : ' en la flota';
  const levelText = tone === 'critical' ? 'crítica' : 'preventiva';
  const plural = count === 1 ? '' : 's';

  return `${count} alerta${plural} ${levelText}${plural} activa${plural}: ${topicText} pendiente${plural}${entityText}.`;
}

function RecommendedActionCard({ recommendation, to, isDarkMode, onAddSoat, onAddRtm }) {
  const isCritical = recommendation.tone === 'critical';
  const isPreventive = recommendation.tone === 'preventive';
  const Icon = isCritical ? AlertTriangle : isPreventive ? BellRing : ShieldCheck;
  const alertId = String(recommendation.alert?.id || '');
  const contextualAction = alertId.startsWith('missing-soat-')
    ? { label: 'Registrar SOAT', onClick: onAddSoat, icon: FilePlus2 }
    : alertId.startsWith('missing-rtm-')
      ? { label: 'Registrar RTM', onClick: onAddRtm, icon: Wrench }
      : null;
  const accentClass = isCritical
    ? 'border-l-red-500'
    : isPreventive
      ? 'border-l-amber-500'
      : 'border-l-emerald-500';
  const iconClass = isCritical
    ? 'bg-red-500/10 text-red-500'
    : isPreventive
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

  return (
    <SurfaceCard className={`border-l-4 p-5 ${accentClass}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`rounded-xl p-3 ${iconClass}`}><Icon className="h-5 w-5" /></div>
          <div className="min-w-0">
            <p className="eyebrow">Acción recomendada</p>
            <h2 className={`mt-2 text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {recommendation.title}
            </h2>
            <p className={`mt-1 text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {recommendation.description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link to={to('/alertas')} className="btn-primary">Ver alertas <ArrowRight className="h-4 w-4" /></Link>
          {contextualAction && (
            <button type="button" onClick={contextualAction.onClick} className="btn-secondary">
              <contextualAction.icon className="h-4 w-4" /> {contextualAction.label}
            </button>
          )}
          <Link to={to('/documentos')} className="btn-secondary">Revisar documentos</Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

function SectionHeading({ icon: Icon, title, description, link, isDarkMode }) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5 ${
      isDarkMode ? 'border-slate-800' : 'border-slate-100'
    }`}>
      <div className="flex min-w-0 gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-syntix-navy'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h2>
          <p className={`mt-1 text-xs leading-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
        </div>
      </div>
      {link && <Link to={link} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-300">Ver todo <ArrowRight className="h-3.5 w-3.5" /></Link>}
    </div>
  );
}

function AlertRow({ alert, isDarkMode }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${
      isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
    }`}>
      <StatusBadge status={alert.prioridad} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{alert.mensaje}</p>
        <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{alert.entidad}</p>
        <p className={`mt-1 text-xs font-semibold ${alert.prioridad === 'rojo' ? 'text-red-500' : 'text-amber-600'}`}>
          {alert.reason || formatColombianDate(alert.fechaVencimiento)}
        </p>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, description, isDarkMode }) {
  return (
    <Link to={to} className={`group rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
      isDarkMode ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700' : 'border-slate-100 bg-slate-50/70 hover:border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-2 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-syntix-navy shadow-sm'}`}><Icon className="h-5 w-5" /></div>
        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
      </div>
      <p className={`mt-4 text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</p>
      <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
    </Link>
  );
}

const itemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  estado: PropTypes.string,
});

DashboardView.propTypes = {
  vehiculos: PropTypes.arrayOf(itemShape).isRequired,
  conductores: PropTypes.arrayOf(itemShape).isRequired,
  soats: PropTypes.arrayOf(itemShape).isRequired,
  rtms: PropTypes.arrayOf(itemShape).isRequired,
  alerts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    prioridad: PropTypes.string,
    mensaje: PropTypes.string,
    entidad: PropTypes.string,
    reason: PropTypes.string,
    diasRestantes: PropTypes.number,
    fechaVencimiento: PropTypes.string,
  })).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  readOnly: PropTypes.bool,
  basePath: PropTypes.string,
  onAddVehicle: PropTypes.func.isRequired,
  onAddConductor: PropTypes.func.isRequired,
  onAddSoat: PropTypes.func.isRequired,
  onAddRtm: PropTypes.func.isRequired,
};

RecommendedActionCard.propTypes = {
  recommendation: PropTypes.shape({
    tone: PropTypes.oneOf(['critical', 'preventive', 'positive']).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    alert: PropTypes.object,
    count: PropTypes.number.isRequired,
  }).isRequired,
  to: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  onAddSoat: PropTypes.func.isRequired,
  onAddRtm: PropTypes.func.isRequired,
};

SectionHeading.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  link: PropTypes.string,
  isDarkMode: PropTypes.bool.isRequired,
};

AlertRow.propTypes = {
  alert: PropTypes.object.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

QuickLink.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};
