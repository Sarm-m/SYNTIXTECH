import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

// Guard de navegación para preservar la intención del usuario al redirigir al login.
export default function ProtectedRoute() {
  const { user, token, isLocalAuthFallbackEnabled } = useAuth();
  const location = useLocation();
  const hasBackendSession = Boolean(user && token);
  const hasAllowedLocalSession = Boolean(user && !token && isLocalAuthFallbackEnabled);

  if (!hasBackendSession && !hasAllowedLocalSession) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
