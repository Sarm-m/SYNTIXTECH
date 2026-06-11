import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  BarChart3,
  BellRing,
  Car,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Users,
  X,
} from 'lucide-react';
import { DemoProvider } from '@/contexts/DemoContext.jsx';
import { DemoBanner } from '@/components/UI/SaasUI.jsx';

const navItems = [
  { path: '/demo/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/demo/vehiculos', label: 'Vehículos', icon: Car },
  { path: '/demo/conductores', label: 'Conductores', icon: Users },
  { path: '/demo/documentos', label: 'Documentos', icon: FileText },
  { path: '/demo/alertas', label: 'Alertas', icon: BellRing },
  { path: '/demo/validacion-runt', label: 'Validación RUNT', icon: Search },
  { path: '/demo/reportes', label: 'Reportes', icon: BarChart3 },
];

export default function DemoLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DemoProvider>
      <div className="dvh-screen flex overflow-hidden bg-slate-50 dark:bg-[#020617]">
        {sidebarOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Cerrar navegación demo" />}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
            <Link to="/" className="text-lg font-black tracking-tight">Drive<span className="text-blue-400">Control</span></Link>
            <button type="button" onClick={() => setSidebarOpen(false)} className="btn-icon text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mx-3 mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Demo pública</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Transportes Horizonte Demo</p>
          </div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}>
                <item.icon className="h-5 w-5" /> {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-800 p-4">
            <Link to="/" className="flex min-h-11 items-center justify-center rounded-xl border border-slate-700 text-sm font-bold text-slate-200 hover:bg-slate-800">Volver al sitio</Link>
            <p className="mt-3 text-center text-[11px] text-slate-500">DriveControl v1.0.0</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-blue-400/10 bg-[linear-gradient(110deg,#050B18,#08162E_60%,#11203A)] px-4 text-white shadow-lg shadow-slate-950/20 lg:px-6">
            <button type="button" onClick={() => setSidebarOpen(true)} className="btn-icon text-white hover:bg-white/10 lg:hidden" aria-label="Abrir navegación demo"><Menu className="h-5 w-5" /></button>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recorrido de producto</p>
              <p className="text-sm font-bold">Datos ficticios, experiencia real</p>
            </div>
            <Link to="/#contacto" className="btn-outline min-h-10 shrink-0 whitespace-nowrap border-white/15 px-3 text-xs text-white hover:bg-white/15 sm:px-4 sm:text-sm">Solicitar acceso</Link>
          </header>
          <DemoBanner />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
            <div className="mx-auto max-w-7xl"><Outlet /></div>
          </main>
        </div>
      </div>
    </DemoProvider>
  );
}
