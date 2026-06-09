import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

// Las rutas privadas vuelven al home, donde siguen disponibles los modales de acceso.
export default function ProtectedRoute() {
  const { user, token, isLocalAuthFallbackEnabled } = useAuth();
  const hasBackendSession = Boolean(user && token);
  const hasAllowedLocalSession = Boolean(user && !token && isLocalAuthFallbackEnabled);

  if (!hasBackendSession && !hasAllowedLocalSession) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
