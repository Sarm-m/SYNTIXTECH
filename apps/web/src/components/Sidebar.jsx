import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Car, Users, FileText, BellRing, Search, BarChart3, Settings, User, X } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts.js';
import { useTheme } from '@/contexts/ThemeContext.jsx';

// Sidebar concentra los módulos del backoffice y refleja cuántas alertas siguen activas.
export default function Sidebar({ isOpen, toggleSidebar }) {
  const { totalActiveAlerts, isReady, isLoading } = useAlerts();
  const { isDarkMode } = useTheme();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    {
      path: '/alertas',
      icon: BellRing,
      label: 'Alertas',
      badge: isReady ? totalActiveAlerts : null,
      badgeLoading: isLoading,
    },
    { path: '/vehiculos', icon: Car, label: 'Vehículos' },
    { path: '/conductores', icon: Users, label: 'Conductores' },
    { path: '/documentos', icon: FileText, label: 'Documentos' },
    { path: '/validacion-runt', icon: Search, label: 'Validación RUNT' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
    { path: '/perfil', icon: User, label: 'Perfil' },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          aria-label="Cerrar menu lateral"
        />
      )}

      <aside
          data-onboarding="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-full min-h-screen w-64 transform flex-col border-r transition-transform duration-200 ease-in-out lg:static lg:min-h-0 lg:h-full ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white'}`}
      >
        <div className={`flex h-16 items-center justify-between border-b px-6 text-white ${
            isDarkMode ? 'border-slate-800 bg-[#020617]' : 'border-blue-400/10 bg-[linear-gradient(120deg,#050B18,#08162E_60%,#11203A)]'
          }`}>
          <Link to="/" className="flex flex-col leading-none hover:opacity-80 transition-opacity cursor-pointer">
            <span className="text-lg font-black tracking-tight">Drive<span className="text-blue-400">Control</span></span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">SYNTIX TECH</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 hover:bg-white/10 rounded text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className={`min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/80'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20'
                    : isDarkMode
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-syntix-navy'
                }`
              }
            >
              {/* Se separa badge de alerta del contenido para que solo ese módulo
                  muestre señal visual cuando existan pendientes activos. */}
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>

              {item.badgeLoading && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                  ...
                </span>
              )}
              {!item.badgeLoading && item.badge > 0 && (
                <span className="bg-syntix-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`mt-auto shrink-0 border-t p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'}`}>
          <div className={`text-center text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            DriveControl v1.0.0
          </div>
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};
