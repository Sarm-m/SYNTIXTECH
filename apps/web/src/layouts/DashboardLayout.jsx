import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext.jsx';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import OnboardingTour from '@/components/OnboardingTour.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';

// DashboardLayout mantiene la estructura compartida del backoffice:
// navegación lateral, cabecera fija y espacio central para cada módulo.
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isInteractionLocked } = useOnboarding();
  const { isDarkMode } = useTheme();

  return (
    <div className={`dvh-screen flex w-full overflow-hidden overflow-x-hidden font-sans ${isDarkMode ? 'bg-slate-950' : 'bg-gray-100'}`}>
      {/* Cuando el onboarding bloquea interacción, se congela tanto el sidebar
          como el contenido para que el usuario siga el flujo guiado sin desviarse. */}
      <div
        aria-hidden={isInteractionLocked}
        className={`h-full min-h-0 flex-shrink-0 self-stretch ${isInteractionLocked ? 'pointer-events-none select-none' : ''}`}
      >
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      <div
        aria-hidden={isInteractionLocked}
        className={`flex min-w-0 flex-1 flex-col overflow-hidden ${isInteractionLocked ? 'pointer-events-none select-none' : ''}`}
      >
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Outlet renderiza cada módulo protegido dentro del mismo marco visual. */}
        <main className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 lg:p-8 ${isDarkMode ? 'bg-slate-950 text-slate-100' : ''}`}>
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <OnboardingTour />
    </div>
  );
}
