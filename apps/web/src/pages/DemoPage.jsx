import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  Car,
  Download,
  FileText,
  Search,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import DashboardView from '@/components/DashboardView.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import {
  EmptyState,
  MetricCard,
  PageHeader,
  SurfaceCard,
} from '@/components/UI/SaasUI.jsx';
import { useDemo } from '@/contexts/DemoContext.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { formatColombianDate, getExpirationAlertText, getStatusLabel } from '@/utils/dateUtils.js';
import { useRUNTSimulator } from '@/hooks/useRUNTSimulator.js';
import { downloadDemoCsv } from '@/utils/demoData.js';

const readOnlyMessage = 'Esta acción está deshabilitada en la demo pública. Crea una cuenta para gestionar tu propia flota.';

export default function DemoPage({ module }) {
  const demo = useDemo();
  const toast = useToast();
  const readOnly = () => toast.info(readOnlyMessage);

  if (module === 'dashboard') {
    return (
      <>
        <Helmet><title>Demo | DriveControl</title></Helmet>
        <DashboardView
          {...demo}
          basePath="/demo"
          readOnly
          onAddVehicle={readOnly}
          onAddConductor={readOnly}
          onAddSoat={readOnly}
          onAddRtm={readOnly}
        />
      </>
    );
  }

  if (module === 'vehiculos') return <DemoVehicles />;
  if (module === 'conductores') return <DemoConductors />;
  if (module === 'documentos') return <DemoDocuments />;
  if (module === 'alertas') return <DemoAlerts />;
  if (module === 'validacion-runt') return <DemoRunt />;
  return <DemoReports />;
}

function DemoVehicles() {
  const { vehiculos } = useDemo();
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const filtered = vehiculos.filter((vehicle) => {
    const matchesQuery = [vehicle.placa, vehicle.marca, vehicle.modelo, vehicle.tipo]
      .some((value) => String(value || '').toLowerCase().includes(query.toLowerCase()));
    return matchesQuery && (status === 'todos' || vehicle.estadoGeneral === status);
  });

  return (
    <DemoModuleShell title="Vehículos de la flota" description="Consulta el inventario y el estado documental consolidado de cada unidad.">
      <Filters query={query} setQuery={setQuery} status={status} setStatus={setStatus} placeholder="Buscar por placa, marca o modelo..." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((vehicle) => (
          <SurfaceCard key={vehicle.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{vehicle.placa}</p>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{vehicle.marca} {vehicle.modelo} · {vehicle.tipo}</p>
              </div>
              <StatusBadge status={vehicle.estadoGeneral} />
            </div>
            <dl className={`mt-5 grid grid-cols-2 gap-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Info label="Conductor" value={vehicle.conductor?.nombre || 'Sin asignar'} />
              <Info label="Estado" value={vehicle.estadoRazon} />
              <Info label="SOAT" value={vehicle.soat ? getStatusLabel(vehicle.soat.estado) : 'Sin registro'} />
              <Info label="RTM" value={vehicle.rtm ? getStatusLabel(vehicle.rtm.estado) : 'Sin registro'} />
            </dl>
          </SurfaceCard>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon={Car} title="No encontramos vehículos" description="Prueba con otro término o estado documental." />}
    </DemoModuleShell>
  );
}

function DemoConductors() {
  const { conductores, vehiculos } = useDemo();
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const filtered = conductores.filter((driver) => [driver.nombre, driver.documento, driver.categoria].some((value) => String(value || '').toLowerCase().includes(query.toLowerCase())));
  const assignedByDriver = new Map(vehiculos.filter((vehicle) => vehicle.conductorId).map((vehicle) => [String(vehicle.conductorId), vehicle.placa]));

  return (
    <DemoModuleShell title="Conductores activos" description="Revisa asignaciones, categorías y vigencia de licencias.">
      <Filters query={query} setQuery={setQuery} placeholder="Buscar por nombre o documento..." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((driver) => (
          <SurfaceCard key={driver.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{driver.nombre}</p>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>CC {driver.documento} · Licencia {driver.categoria}</p>
              </div>
              <StatusBadge status={driver.estado} />
            </div>
            <div className={`mt-5 grid grid-cols-2 gap-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Info label="Vehículo asignado" value={assignedByDriver.get(String(driver.id)) || 'Sin asignar'} />
              <Info label="Vencimiento" value={formatColombianDate(driver.fechaVencimiento)} />
            </div>
          </SurfaceCard>
        ))}
      </div>
    </DemoModuleShell>
  );
}

function DemoDocuments() {
  const { soats, rtms, vehiculos } = useDemo();
  const [query, setQuery] = useState('');
  const vehicleById = new Map(vehiculos.map((vehicle) => [String(vehicle.id), vehicle]));
  const documents = [
    ...soats.map((item) => ({ ...item, kind: 'SOAT', code: item.numeroPoliza, entity: item.aseguradora, expiration: item.fechaFinVigencia })),
    ...rtms.map((item) => ({ ...item, kind: 'RTM', code: item.numeroCertificado, entity: item.cda, expiration: item.fechaVencimiento })),
  ].filter((item) => [item.kind, item.code, item.entity, vehicleById.get(String(item.vehiculoId))?.placa].some((value) => String(value || '').toLowerCase().includes(query.toLowerCase())));

  return (
    <DemoModuleShell title="Control documental" description="SOAT y revisiones técnico-mecánicas centralizadas con semáforo de vigencia.">
      <Filters query={query} setQuery={setQuery} placeholder="Buscar placa, documento o entidad..." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {documents.map((document) => {
          const expiration = getExpirationAlertText(document.diasRestantes, document.expiration);
          return (
            <SurfaceCard key={`${document.kind}-${document.id}`} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-wider text-syntix-green">{document.kind}</p><p className="mt-1 font-black dark:text-slate-100">{vehicleById.get(String(document.vehiculoId))?.placa}</p></div>
                <StatusBadge status={document.estado} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
                <Info label="Documento" value={document.code} />
                <Info label="Entidad" value={document.entity} />
                <Info label="Vencimiento" value={formatColombianDate(document.expiration)} />
                <Info label="Estado" value={expiration.primaryText} />
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </DemoModuleShell>
  );
}

function DemoAlerts() {
  const { alerts } = useDemo();
  const { isDarkMode } = useTheme();
  const [status, setStatus] = useState('todos');
  const filtered = alerts.filter((alert) => status === 'todos' || alert.prioridad === status);
  return (
    <DemoModuleShell title="Centro de alertas" description="Prioriza riesgos documentales y asignaciones pendientes antes de que afecten la operación.">
      <Filters status={status} setStatus={setStatus} />
      <div className="space-y-3">
        {filtered.map((alert) => (
          <SurfaceCard key={alert.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-2 ${alert.prioridad === 'rojo' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'}`}><BellRing className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2"><p className={`font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{alert.mensaje}</p><StatusBadge status={alert.prioridad} /></div>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{alert.entidad}</p>
                <p className={`mt-2 text-xs font-semibold ${alert.prioridad === 'rojo' ? 'text-red-500' : 'text-amber-600'}`}>{alert.reason}</p>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </DemoModuleShell>
  );
}

function DemoReports() {
  const { vehiculos, conductores, soats, rtms, alerts, qualityMetrics } = useDemo();
  const toast = useToast();
  const compliance = Math.round((vehiculos.filter((vehicle) => vehicle.estadoGeneral === 'verde').length / vehiculos.length) * 100);
  const handleDownload = () => {
    downloadDemoCsv({ vehiculos });
    toast.success('Reporte demo descargado correctamente.');
  };
  return (
    <DemoModuleShell
      title="Reportes y analítica"
      description="Indicadores ejecutivos para entender cumplimiento, riesgo y calidad de la información."
      actions={<button type="button" onClick={handleDownload} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-syntix-navy px-4 py-2 text-sm font-bold text-white"><Download className="h-4 w-4" /> Descargar CSV</button>}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard icon={Car} label="Vehículos" value={vehiculos.length} />
        <MetricCard icon={Users} label="Conductores" value={conductores.length} />
        <MetricCard icon={ShieldCheck} label="SOAT" value={soats.length} />
        <MetricCard icon={Wrench} label="RTM" value={rtms.length} />
        <MetricCard icon={AlertTriangle} label="Alertas" value={alerts.length} tone="red" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SurfaceCard className="bg-syntix-navy p-6 text-white lg:col-span-1">
          <p className="text-sm font-semibold text-slate-300">Cumplimiento documental</p>
          <p className="mt-4 text-6xl font-black text-syntix-green">{compliance}%</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">Vehículos al día según el estado combinado de conductor, SOAT y RTM.</p>
        </SurfaceCard>
        <div className="grid grid-cols-1 gap-4 lg:col-span-2">
          {qualityMetrics.map((metric) => (
            <SurfaceCard key={metric.id} className="p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-500 dark:text-slate-400">{metric.name}</p><p className="mt-2 text-3xl font-black text-syntix-navy dark:text-slate-100">{metric.value}%</p></div><StatusBadge status={metric.status} /></div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{metric.interpretation}</p>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </DemoModuleShell>
  );
}

function DemoRunt() {
  const { searchByPlaca } = useRUNTSimulator();
  const [plate, setPlate] = useState('ABC-123');
  const [result, setResult] = useState(null);
  const handleSearch = (event) => {
    event.preventDefault();
    setResult(searchByPlaca(plate));
  };
  return (
    <DemoModuleShell title="Validación RUNT simulada" description="Consulta una placa ficticia para comprobar SOAT y RTM antes de vincularla a la flota.">
      <SurfaceCard className="p-5">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 font-bold uppercase outline-none focus:border-syntix-green dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="ABC-123" /></div>
          <button type="submit" className="min-h-12 rounded-xl bg-syntix-navy px-6 text-sm font-bold text-white">Consultar placa</button>
        </form>
        <p className="mt-3 text-xs text-slate-500">Prueba también con XYZ-987 o DEF-456.</p>
      </SurfaceCard>
      {result?.encontrado && <SurfaceCard className="p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-2xl font-black dark:text-slate-100">{result.data.placa}</p><p className="mt-1 text-sm text-slate-500">{result.data.marca} {result.data.linea} · {result.data.modelo}</p></div><StatusBadge status={result.data.soat.vigente && result.data.rtm.vigente ? 'verde' : 'rojo'} /></div><div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"><DocumentResult title="SOAT" data={result.data.soat} /><DocumentResult title="RTM" data={result.data.rtm} /></div></SurfaceCard>}
      {result && !result.encontrado && <EmptyState icon={Search} title="Placa no encontrada" description={result.error || 'No encontramos información para la placa consultada.'} />}
    </DemoModuleShell>
  );
}

function DocumentResult({ title, data }) {
  return <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-center justify-between gap-2"><p className="font-black dark:text-slate-100">{title}</p><StatusBadge status={data.vigente ? 'verde' : 'rojo'} /></div><p className="mt-3 text-sm text-slate-500">Vencimiento: {formatColombianDate(data.fechaVencimiento)}</p></div>;
}

function DemoModuleShell({ title, description, actions, children }) {
  return <div className="space-y-6"><Helmet><title>{title} | Demo DriveControl</title></Helmet><PageHeader eyebrow="Demo de producto" title={title} description={description} actions={actions} />{children}</div>;
}

function Filters({ query, setQuery, status, setStatus, placeholder = 'Buscar...' }) {
  return (
    <SurfaceCard className="flex flex-col gap-3 p-4 sm:flex-row">
      {setQuery && <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-syntix-green dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder={placeholder} /></div>}
      {setStatus && <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value="todos">Todos los estados</option><option value="verde">Al día</option><option value="amarillo">Por vencer</option><option value="rojo">Crítico</option></select>}
    </SurfaceCard>
  );
}

function Info({ label, value }) {
  return <div><dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>;
}

DemoPage.propTypes = { module: PropTypes.string.isRequired };
DemoModuleShell.propTypes = { title: PropTypes.string.isRequired, description: PropTypes.string.isRequired, actions: PropTypes.node, children: PropTypes.node.isRequired };
Filters.propTypes = { query: PropTypes.string, setQuery: PropTypes.func, status: PropTypes.string, setStatus: PropTypes.func, placeholder: PropTypes.string };
Info.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired };
DocumentResult.propTypes = { title: PropTypes.string.isRequired, data: PropTypes.object.isRequired };
