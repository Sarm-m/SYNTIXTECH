import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  FileCheck2,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
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
        <section id="inicio" className="relative overflow-hidden bg-slate-950 pt-28 text-white lg:pt-36">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(45,106,79,0.35),transparent_38%),radial-gradient(circle_at_20%_70%,rgba(37,99,235,0.18),transparent_35%)]" />
          <div className="relative mx-auto grid min-w-0 max-w-7xl items-center gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:pb-28">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <Sparkles className="h-4 w-4" /> Gestión documental para flotas
              </div>
              <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Controla los documentos de tu flota antes de que venzan
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                DriveControl centraliza vehículos, conductores, SOAT, RTM, vencimientos y alertas en una sola plataforma para que tu operación no dependa de Excel, chats o recordatorios manuales.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={isAuthenticated ? () => navigate('/dashboard') : openLogin} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-syntix-green px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
                  {isAuthenticated ? 'Ir al dashboard' : 'Iniciar sesión'} <ArrowRight className="h-4 w-4" />
                </button>
                <Link to="/demo/dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">
                  Ver demo
                </Link>
                <button type="button" onClick={goToProduct} className="inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-slate-300 transition hover:text-white">
                  Conocer funciones
                </button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-syntix-green" /> Alertas automáticas</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-syntix-green" /> Reportes claros</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-syntix-green" /> Datos aislados por cuenta</span>
              </div>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section id="problema" className="bg-slate-50 py-20 sm:py-24">
          <SectionIntro eyebrow="El problema" title="Los vencimientos no deberían sorprender a tu operación" description="Cuando la información vive en archivos, chats y calendarios separados, los documentos críticos pierden visibilidad y el riesgo crece." />
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            <ProblemCard number="01" title="Información dispersa" description="Placas, pólizas, licencias y fechas quedan repartidas entre personas y herramientas." />
            <ProblemCard number="02" title="Reacción tardía" description="El equipo descubre documentos vencidos cuando ya afectan la continuidad operativa." />
            <ProblemCard number="03" title="Poca trazabilidad" description="Es difícil entender qué está al día, qué falta y quién debe actuar primero." />
          </div>
        </section>

        <section id="funciones" className="py-20 sm:py-24">
          <SectionIntro eyebrow="La solución" title="Una vista confiable para gestionar el cumplimiento de la flota" description="DriveControl convierte datos documentales en acciones claras para que el equipo pueda anticiparse." />
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
            {modules.map((item) => <ModuleCard key={item.title} {...item} />)}
          </div>
        </section>

        <section id="beneficios" className="bg-syntix-navy py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Valor operativo</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Menos seguimiento manual. Más control preventivo.</h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-300">El equipo encuentra rápidamente los riesgos, consulta el detalle y toma decisiones con una lectura compartida de la flota.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Prioriza alertas críticas', 'Reduce olvidos y reprocesos', 'Mejora la trazabilidad', 'Facilita reportes de cumplimiento'].map((benefit) => (
                <div key={benefit} className="rounded-2xl border border-white/10 bg-white/5 p-5"><CheckCircle2 className="h-5 w-5 text-syntix-green" /><p className="mt-4 font-bold">{benefit}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section id="seguridad" className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div className="w-fit rounded-2xl bg-syntix-green/10 p-4 text-syntix-green"><LockKeyhole className="h-8 w-8" /></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-syntix-green">Confianza</p><h2 className="mt-2 text-2xl font-black text-syntix-navy">Tus datos permanecen privados por cuenta</h2><p className="mt-3 text-sm leading-6 text-slate-600">La autenticación y el aislamiento por usuario ayudan a que cada organización gestione únicamente su propia información documental.</p></div>
              <Link to="/privacidad" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-syntix-navy hover:bg-slate-100">Ver privacidad</Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20 text-center sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <AlertTriangle className="mx-auto h-8 w-8 text-syntix-green" />
            <h2 className="mt-5 text-3xl font-black tracking-tight text-syntix-navy sm:text-4xl">Entiende el valor de DriveControl en minutos</h2>
            <p className="mt-4 text-slate-600">Recorre una flota ficticia con vehículos, conductores, vencimientos, alertas y reportes, sin registrarte.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/demo/dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-syntix-navy px-6 text-sm font-black text-white hover:bg-slate-700">Ver demo <ArrowRight className="h-4 w-4" /></Link>
              <button type="button" onClick={openRegister} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-black text-syntix-navy hover:bg-slate-100">Crear cuenta</button>
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
    <div className="relative min-w-0 max-w-full">
      <div className="absolute -inset-8 rounded-full bg-syntix-green/20 blur-3xl" />
      <div className="relative min-w-0 max-w-full overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-4 text-slate-900 shadow-2xl sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Centro de control</p><p className="mt-1 font-black text-syntix-navy">Estado de la flota</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Demo</span></div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[['Vehículos', '10'], ['Por vencer', '4'], ['Críticas', '9']].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-syntix-navy">{value}</p></div>)}
        </div>
        <div className="mt-4 space-y-3">
          {[['SOAT vence en 5 días', 'DCV104', 'amarillo'], ['RTM vencida', 'DCV102', 'rojo'], ['Licencia vence en 9 días', 'Mariana Torres', 'amarillo']].map(([title, entity, tone]) => <div key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className={`h-2.5 w-2.5 rounded-full ${tone === 'rojo' ? 'bg-red-500' : 'bg-amber-400'}`} /><div><p className="text-xs font-bold">{title}</p><p className="text-[10px] text-slate-400">{entity}</p></div></div>)}
        </div>
      </div>
    </div>
  );
}

function SectionIntro({ eyebrow, title, description }) {
  return <div className="mx-auto max-w-3xl px-4 text-center sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-syntix-green">{eyebrow}</p><h2 className="mt-4 text-3xl font-black tracking-tight text-syntix-navy sm:text-4xl">{title}</h2><p className="mt-4 leading-7 text-slate-600">{description}</p></div>;
}
function ProblemCard({ number, title, description }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black text-syntix-green">{number}</p><h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>;
}
function ModuleCard({ icon: Icon, title, description }) {
  return <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="w-fit rounded-xl bg-syntix-green/10 p-3 text-syntix-green"><Icon className="h-6 w-6" /></div><h3 className="mt-5 text-lg font-black text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>;
}
