import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { DocumentsProvider } from '@/contexts/DocumentsContext.jsx';
import { RtmProvider } from '@/contexts/RtmContext.jsx';
import { OnboardingProvider } from '@/contexts/OnboardingContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import { LoadingState } from '@/components/UI/SaasUI.jsx';

const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const LegalPage = lazy(() => import('@/pages/LegalPage.jsx'));
const DemoLayout = lazy(() => import('@/layouts/DemoLayout.jsx'));
const DemoPage = lazy(() => import('@/pages/DemoPage.jsx'));
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout.jsx'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const AlertasPage = lazy(() => import('@/pages/AlertasPage.jsx'));
const VehiculosPage = lazy(() => import('@/pages/VehiculosPage.jsx'));
const ConductoresPage = lazy(() => import('@/pages/ConductoresPage.jsx'));
const DocumentosPage = lazy(() => import('@/pages/DocumentosPage.jsx'));
const ValidacionRUNTPage = lazy(() => import('@/pages/ValidacionRUNTPage.jsx'));
const HistorialValidacionesPage = lazy(() => import('@/pages/HistorialValidacionesPage.jsx'));
const ReportesPage = lazy(() => import('@/pages/ReportesPage.jsx'));
const ConfiguracionPage = lazy(() => import('@/pages/ConfiguracionPage.jsx'));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage.jsx'));

const RouteFallback = () => (
  <div className="min-h-screen bg-slate-100 p-4 dark:bg-slate-950 sm:p-8">
    <div className="mx-auto max-w-3xl"><LoadingState label="Preparando DriveControl..." /></div>
  </div>
);

function AuthenticatedAppProviders() {
  return (
    <AuthProvider>
      <DocumentsProvider>
        <RtmProvider>
          <Outlet />
        </RtmProvider>
      </DocumentsProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<AuthProvider><HomePage /></AuthProvider>} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/privacidad" element={<LegalPage type="privacidad" />} />
          <Route path="/terminos" element={<LegalPage type="terminos" />} />

          <Route path="/demo" element={<DemoLayout />}>
            <Route index element={<Navigate to="/demo/dashboard" replace />} />
            <Route path="dashboard" element={<DemoPage module="dashboard" />} />
            <Route path="vehiculos" element={<DemoPage module="vehiculos" />} />
            <Route path="conductores" element={<DemoPage module="conductores" />} />
            <Route path="documentos" element={<DemoPage module="documentos" />} />
            <Route path="alertas" element={<DemoPage module="alertas" />} />
            <Route path="validacion-runt" element={<DemoPage module="validacion-runt" />} />
            <Route path="reportes" element={<DemoPage module="reportes" />} />
          </Route>

          <Route element={<AuthenticatedAppProviders />}>
            <Route element={<ProtectedRoute />}>
              <Route element={<OnboardingProvider><DashboardLayout /></OnboardingProvider>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vehiculos" element={<VehiculosPage />} />
                <Route path="/conductores" element={<ConductoresPage />} />
                <Route path="/documentos" element={<DocumentosPage />} />
                <Route path="/alertas" element={<AlertasPage />} />
                <Route path="/validacion-runt" element={<ValidacionRUNTPage />} />
                <Route path="/historial-validaciones" element={<HistorialValidacionesPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                <Route path="/perfil" element={<UserProfilePage />} />
                <Route path="/configuracion" element={<ConfiguracionPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
