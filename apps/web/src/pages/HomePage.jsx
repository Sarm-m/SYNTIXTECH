import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  FileText,
  Grid2X2,
  LayoutDashboard,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PublicHeader from '@/components/PublicHeader.jsx';
import PublicFooter from '@/components/PublicFooter.jsx';
import ModalFactory from '@/components/ModalFactory.jsx';
import useModalManager from '@/hooks/useModalManager.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { applyLandingHashFromLocation, setLandingHash } from '@/utils/landingNavigation.js';

const modules = [
  { icon: LayoutDashboard, title: 'Centro de control', description: 'Visualiza cumplimiento, riesgos y prioridades sin revisar archivos separados.' },
  { icon: FileCheck2, title: 'Gestión documental', description: 'Centraliza SOAT, RTM y vigencias asociadas a cada vehículo.' },
  { icon: BellRing, title: 'Alertas preventivas', description: 'Anticipa vencimientos y atiende primero los riesgos críticos.' },
  { icon: Users, title: 'Conductores y licencias', description: 'Mantén trazabilidad de asignaciones y vigencia de licencias.' },
  { icon: BarChart3, title: 'Reportes operativos', description: 'Convierte los datos de la flota en indicadores claros y exportables.' },
  { icon: ShieldCheck, title: 'Información por cuenta', description: 'Cada organización accede únicamente a sus datos operativos.' },
];

const heroBenefits = [
  { icon: Bell, title: 'Alertas automáticas', description: 'Notificaciones inteligentes antes de cada vencimiento.' },
  { icon: BarChart3, title: 'Reportes claros', description: 'Indicadores listos para auditorías y decisiones.' },
  { icon: ShieldCheck, title: 'Datos aislados por cuenta', description: 'Información segura y separada por organización.' },
];

const documents = [
  { icon: Truck, title: 'SOAT', status: 'Vigente', tone: 'success', date: 'Vence en 42 días', entity: 'DCV784 · Chevrolet NQR' },
  { icon: FileText, title: 'RTM', status: 'Por vencer', tone: 'warning', date: 'Vence en 7 días', entity: 'Furgón Hino 300' },
  { icon: UserRound, title: 'Licencia', status: 'Vigente', tone: 'success', date: 'Vence en 18 días', entity: 'Mariana Torres · Conductor' },
];

const recentActivity = [
  { icon: FileText, title: 'Documento actualizado', detail: 'SOAT · DCV784', time: 'Actualizado hoy', dot: 'bg-emerald-400' },
  { icon: Bell, title: 'Alerta preventiva enviada', detail: 'RTM · Furgón Hino 300', time: 'Hace 1 hora', dot: 'bg-amber-400' },
  { icon: CheckCircle2, title: 'Revisión completada', detail: 'Licencia · Mariana Torres', time: 'Hace 2 horas', dot: 'bg-blue-400' },
];

const monthlyCompliance = [
  { month: 'Ene', value: 48 },
  { month: 'Feb', value: 64 },
  { month: 'Mar', value: 74 },
  { month: 'Abr', value: 77 },
  { month: 'May', value: 87 },
  { month: 'Jun', value: 92 },
];

export default function HomePage() {
  const { activeModal, openModal, closeModal } = useModalManager();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') return undefined;
    const frameId = requestAnimationFrame(() => applyLandingHashFromLocation(location.hash));
    return () => cancelAnimationFrame(frameId);
  }, [location.hash, location.pathname]);

  const openLogin = () => openModal('login');
  const openRegister = () => openModal('register');
  const goToProduct = () => setLandingHash('funciones');

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900">
      <Helmet>
        <title>DriveControl | Control documental de flotas</title>
        <meta name="description" content="Centraliza vehículos, conductores, SOAT, RTM, vencimientos y alertas para mantener tu flota bajo control." />
      </Helmet>
      <PublicHeader onLoginClick={openLogin} onRegisterClick={openRegister} />

      <main>
        <section id="inicio" className="landing-hero relative isolate overflow-hidden bg-[#020817] pb-16 pt-28 text-white sm:pb-20 lg:pt-32 xl:min-h-screen xl:pb-10">
          <div className="landing-hero-grid absolute inset-0 -z-20" />
          <div className="landing-rays absolute inset-0 -z-10" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-blue-400/45 to-transparent" />

          <div className="relative mx-auto grid max-w-[1600px] items-center gap-14 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.42fr)] xl:gap-10">
            <div className="min-w-0 xl:py-4">
              <div className="inline-flex items-center gap-3 text-sm font-semibold text-blue-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-300 shadow-[0_0_20px_rgba(37,99,235,0.16)]">
                  <FileCheck2 className="h-4 w-4" />
                </span>
                Gestión documental para flotas
              </div>

              <h1 className="mt-8 max-w-[760px] text-[2.5rem] font-black leading-[1.08] tracking-[-0.035em] text-slate-50 sm:text-[3.15rem] lg:text-[3.5rem] xl:text-[2.75rem] 2xl:text-[3.35rem]">
                Gestiona el cumplimiento documental de tu flota desde una sola plataforma<span className="text-blue-500">.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 xl:max-w-xl">
                DriveControl centraliza vehículos, conductores, SOAT, RTM, licencias, vencimientos y alertas preventivas para que tu operación actúe antes de que un documento crítico afecte la continuidad del servicio.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/demo/dashboard" className="landing-primary-cta">
                  Ver demo interactiva <PlayCircle className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={isAuthenticated ? () => navigate('/dashboard') : openRegister}
                  className="landing-secondary-cta"
                >
                  {isAuthenticated ? 'Ir al dashboard' : 'Registrarse'} <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={goToProduct} className="landing-link-cta">
                  Conocer funciones <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-12 grid gap-5 border-t border-white/10 pt-7 sm:grid-cols-3 xl:mt-14 xl:gap-3 2xl:gap-5">
                {heroBenefits.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="group flex gap-3 sm:block xl:flex">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-400/[0.08] text-blue-300 transition group-hover:border-blue-300/35 group-hover:bg-blue-400/[0.13]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 sm:mt-3 xl:mt-0">
                      <p className="text-[11px] font-bold uppercase leading-4 tracking-wide text-blue-200">{title}</p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section id="problema" className="bg-slate-50/80 py-20 sm:py-24">
          <SectionIntro eyebrow="El problema" title="Los vencimientos no deberían sorprender a tu operación" description="Cuando la información vive en archivos, chats y calendarios separados, los documentos críticos pierden visibilidad y el riesgo crece." />
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            <ProblemCard number="01" title="Información dispersa" description="Placas, pólizas, licencias y fechas quedan repartidas entre personas y herramientas." />
            <ProblemCard number="02" title="Reacción tardía" description="El equipo descubre documentos vencidos cuando ya afectan la continuidad operativa." />
            <ProblemCard number="03" title="Poca trazabilidad" description="Es difícil entender qué está al día, qué falta y quién debe actuar primero." />
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <SectionIntro
            eyebrow="Cómo funciona"
            title="Del registro a la acción preventiva en tres pasos"
            description="DriveControl organiza el seguimiento documental para que el equipo pueda actuar con contexto y a tiempo."
          />
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            <ProblemCard number="01" title="Registra la flota" description="Registra vehículos, conductores y documentos clave." />
            <ProblemCard number="02" title="Controla vencimientos" description="DriveControl organiza vencimientos y estados en una vista centralizada." />
            <ProblemCard number="03" title="Actúa con alertas" description="El equipo prioriza alertas y toma acciones antes de que el riesgo sea crítico." />
          </div>
        </section>

        <section id="funciones" className="bg-slate-50/80 py-20 sm:py-24">
          <SectionIntro eyebrow="La solución" title="Una vista confiable para gestionar el cumplimiento de la flota" description="DriveControl convierte datos documentales en acciones claras para que el equipo pueda anticiparse." />
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
            {modules.map((item) => <ModuleCard key={item.title} {...item} />)}
          </div>
        </section>

        <section id="beneficios" className="bg-[radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.24),transparent_34%),linear-gradient(135deg,#050B18,#08162E_55%,#0F1A2E)] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Valor operativo</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Menos seguimiento manual. Más control preventivo.</h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-300">El equipo encuentra rápidamente los riesgos, consulta el detalle y toma decisiones con una lectura compartida de la flota.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Prioriza alertas críticas', 'Reduce olvidos y reprocesos', 'Mejora la trazabilidad', 'Facilita reportes de cumplimiento'].map((benefit) => (
                <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm transition hover:border-blue-300/25 hover:bg-white/[0.09]"><CheckCircle2 className="h-5 w-5 text-blue-300" /><p className="mt-4 font-bold">{benefit}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section id="seguridad" className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-8 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-6 shadow-premium sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div className="w-fit rounded-2xl bg-blue-50 p-4 text-blue-700 ring-1 ring-blue-100"><LockKeyhole className="h-8 w-8" /></div>
              <div><p className="eyebrow">Confianza</p><h2 className="mt-2 text-2xl font-black text-syntix-navy">Tus datos permanecen privados por cuenta</h2><p className="mt-3 text-sm leading-6 text-slate-600">La autenticación y el aislamiento por usuario ayudan a que cada organización gestione únicamente su propia información documental.</p></div>
              <Link to="/privacidad" className="btn-secondary">Ver privacidad</Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20 text-center sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <AlertTriangle className="mx-auto h-8 w-8 text-blue-600" />
            <h2 className="mt-5 text-3xl font-black tracking-tight text-syntix-navy sm:text-4xl">Entiende el valor de DriveControl en minutos</h2>
            <p className="mt-4 text-slate-600">Recorre una flota ficticia con vehículos, conductores, vencimientos, alertas y reportes, sin registrarte.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/demo/dashboard" className="btn-primary min-h-12 px-6 font-black">Ver demo interactiva <ArrowRight className="h-4 w-4" /></Link>
              <button type="button" onClick={openRegister} className="btn-secondary min-h-12 px-6 font-black">Registrarse</button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
      <ModalFactory modalType={activeModal} onClose={closeModal} onSwitchToRegister={openRegister} onSwitchToLogin={openLogin} />
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative min-w-0 max-w-full xl:-mr-2">
      <div className="absolute -inset-8 rounded-[3rem] bg-blue-500/[0.08] blur-3xl" />
      <div className="command-shell relative min-w-0 overflow-hidden rounded-[1.35rem] border border-slate-700/55 bg-[#07111f]/95 p-3 shadow-[0_35px_90px_-32px_rgba(0,0,0,0.85)] ring-1 ring-blue-300/[0.04] backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 border-b border-slate-700/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-300">
              <Grid2X2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-100 sm:text-base">Centro de comando</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Resumen operativo de la flota</p>
            </div>
          </div>
          <button type="button" className="flex min-h-9 items-center justify-between gap-3 rounded-lg border border-slate-700/70 bg-slate-900/55 px-3 text-[11px] font-medium text-slate-300 transition hover:border-blue-400/30 hover:text-white sm:justify-center">
            <Building2 className="h-3.5 w-3.5 text-blue-300" /> Todas las cuentas <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
          <ComplianceCard />
          <MetricCard icon={CalendarDays} label="Vencimientos próximos" value="11" detail="Próximos 30 días" link="Ver detalles" />
          <MetricCard icon={AlertTriangle} label="Alertas críticas" value="3" detail="Requieren atención" link="Ver alertas" tone="danger" />
          <MetricCard icon={Truck} label="Vehículos activos" value="10" detail="En operación" link="Ver vehículos" />
        </div>

        <div className="mt-3 grid min-w-0 gap-3 2xl:grid-cols-[1.18fr_0.95fr]">
          <div className="min-w-0 space-y-2">
            {documents.map(({ icon: Icon, title, status, tone, date, entity }) => (
              <div key={title} className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-700/55 bg-slate-900/40 p-2.5 transition hover:border-blue-400/25 hover:bg-slate-800/55">
                <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700/60 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.18),transparent_55%),linear-gradient(145deg,#17243a,#0b1422)] text-blue-300 shadow-inner sm:h-14 sm:w-16">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-slate-100 sm:text-sm">{title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${tone === 'warning' ? 'border-amber-400/20 bg-amber-400/10 text-amber-300' : 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300'}`}>
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-[11px]">{date}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-[11px]">{entity}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-blue-300" />
              </div>
            ))}
            <button type="button" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-700/55 bg-slate-900/35 text-[11px] font-medium text-blue-300 transition hover:border-blue-400/25 hover:bg-slate-800/50">
              Ver todos los documentos <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] text-blue-200">36</span><ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            <div className="rounded-xl border border-slate-700/55 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-100">Actividad reciente</p>
                <Activity className="h-3.5 w-3.5 text-blue-300" />
              </div>
              <div className="mt-2 divide-y divide-slate-700/45">
                {recentActivity.map(({ icon: Icon, title, detail, time, dot }) => (
                  <div key={title} className="flex min-w-0 items-center gap-2.5 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/15 bg-blue-400/[0.07] text-blue-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-slate-200 sm:text-[11px]">{title}</p>
                      <p className="mt-0.5 truncate text-[9px] text-slate-500 sm:text-[10px]">{detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="hidden text-[8px] text-slate-500 sm:block">{time}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-1 flex items-center gap-1 text-[10px] font-medium text-blue-300 transition hover:text-blue-200">
                Ver toda la actividad <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-700/55 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-100">Cumplimiento mensual</p>
                <span className="rounded-md border border-blue-300/30 bg-blue-400/15 px-2 py-1 text-[10px] font-bold text-blue-200">92%</span>
              </div>
              <div className="relative mt-4 h-24 border-b border-l border-slate-700/60">
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-700/45" />
                <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                  {monthlyCompliance.map(({ month, value }) => (
                    <div key={month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                      <div className="w-full max-w-5 rounded-t-sm bg-gradient-to-t from-blue-700 to-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.2)]" style={{ height: `${value}%` }} />
                      <span className="text-[8px] text-slate-500">{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-700/50 bg-slate-900/35 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 text-[9px] text-slate-400 sm:text-[10px]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-300" /> Datos separados por cuenta y autenticación protegida.
          </div>
          <div className="flex items-center gap-2 text-[9px] text-slate-400">
            <span className="rounded-md border border-slate-700/60 px-2 py-1">Historial auditable</span>
            <span className="rounded-md border border-slate-700/60 px-2 py-1">Demo con datos ficticios</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceCard() {
  return (
    <div className="rounded-xl border border-slate-700/55 bg-slate-900/40 p-3">
      <p className="text-[10px] font-medium text-slate-300">Estado de cumplimiento</p>
      <div className="mt-2 flex items-center gap-3 2xl:block">
        <div className="compliance-gauge relative mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full">
          <div className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full bg-[#0a1422]">
            <span className="text-lg font-bold text-slate-100">92<span className="text-xs">%</span></span>
          </div>
        </div>
        <p className="mt-1 text-center text-[9px] text-slate-500 sm:text-[10px]">Cumplimiento general</p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, link, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-slate-700/55 bg-slate-900/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium leading-4 text-slate-300">{label}</p>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${tone === 'danger' ? 'border-red-400/15 bg-red-400/[0.07] text-red-400' : 'border-blue-400/15 bg-blue-400/[0.06] text-blue-300'}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">{value}</p>
      <p className="mt-0.5 text-[9px] text-slate-500 sm:text-[10px]">{detail}</p>
      <button type="button" className="mt-2 flex items-center gap-1 border-t border-slate-700/50 pt-2 text-[9px] font-medium text-blue-300 transition hover:text-blue-200 sm:text-[10px]">
        {link} <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function SectionIntro({ eyebrow, title, description }) {
  return <div className="mx-auto max-w-3xl px-4 text-center sm:px-6"><p className="eyebrow">{eyebrow}</p><h2 className="mt-4 text-3xl font-black tracking-tight text-syntix-navy sm:text-4xl">{title}</h2><p className="mt-4 leading-7 text-slate-600">{description}</p></div>;
}

function ProblemCard({ number, title, description }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium transition hover:-translate-y-0.5 hover:border-blue-200"><p className="text-xs font-black text-blue-600">{number}</p><h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>;
}

function ModuleCard({ icon: Icon, title, description }) {
  return <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"><div className="w-fit rounded-xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100 transition group-hover:bg-blue-100"><Icon className="h-6 w-6" /></div><h3 className="mt-5 text-lg font-black text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>;
}
