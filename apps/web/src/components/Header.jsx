import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useOnboarding } from '@/contexts/OnboardingContext.jsx';
import { Menu, Bell, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAlerts } from '@/hooks/useAlerts.js';
import UserProfileDropdown from '@/components/UserProfileDropdown.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';

// Header muestra el contexto actual del dashboard y concentra acciones globales:
// navegación móvil, alertas activas y cierre de sesión.
export default function Header({ toggleSidebar }) {
  const { user } = useAuth();
  const { startTour } = useOnboarding();
  const location = useLocation();
  const navigate = useNavigate();
  const { totalActiveAlerts, isReady, isLoading } = useAlerts();
  const { isDarkMode } = useTheme();

  const alertCount = isReady ? totalActiveAlerts : 0;
  const hasActiveAlerts = isReady && alertCount > 0;
  const handleAlertsClick = () => navigate('/alertas');

  // El breadcrumb simple se deriva de la ruta activa para evitar títulos hardcodeados por vista.
  const pathNames = location.pathname.split('/').filter(x => x);
  const currentPage = pathNames.length > 0 ? pathNames[pathNames.length - 1] : 'Dashboard';

  return (
    <header className={`h-16 sticky top-0 z-30 flex items-center justify-between px-4 text-white shadow-md lg:px-8 ${
      isDarkMode ? 'border-b border-slate-800 bg-slate-900' : 'border-b border-blue-400/10 bg-[linear-gradient(110deg,#050B18,#08162E_60%,#11203A)] shadow-lg shadow-slate-950/15'
    }`}>
      <div className="flex items-center gap-4">
        {/* El botón móvil abre el sidebar sin duplicar navegación dentro del contenido. */}
        <button onClick={toggleSidebar} className="btn-icon border-white/10 text-gray-300 hover:bg-white/10 hover:text-white lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-300">
          <span>DriveControl</span>
          <span className="text-gray-500">/</span>
          <span className="text-white capitalize">{currentPage.replace('-', ' ')}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* El tutorial sigue accesible desde la cabecera para no perderse cuando
            el usuario navega entre módulos del dashboard. */}
        <button
          type="button"
          onClick={startTour}
          className={`btn-outline h-10 min-h-10 w-10 rounded-xl px-0 text-xs md:w-auto md:gap-2 md:px-3 ${
            isDarkMode
              ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
              : 'border-white/15 text-gray-200 hover:bg-white/10'
          }`}
          title="Abrir tutorial"
          aria-label="Abrir tutorial"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline">Tutorial</span>
        </button>
        {/* El centro de alertas conserva acceso rápido desde cualquier módulo. */}
        <button
          onClick={handleAlertsClick}
          className={`btn-icon relative ${
            isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-300 hover:bg-white/10'
          }`}
          title="Ver alertas"
        >
          <Bell className="w-5 h-5" />
          {hasActiveAlerts && (
            <span className={`absolute top-1 right-1 h-2.5 w-2.5 rounded-full border-2 bg-syntix-red ${
              isDarkMode ? 'border-slate-900' : 'border-syntix-navy'
            }`}></span>
          )}
        </button>
        {user && (
          <div className={`border-l pl-4 ${isDarkMode ? 'border-slate-700' : 'border-white/20'}`}>
            <UserProfileDropdown variant="dark" />
          </div>
        )}
      </div>
    </header>
  );
}

Header.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};
