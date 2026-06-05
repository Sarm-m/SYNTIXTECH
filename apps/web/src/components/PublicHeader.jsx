import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LayoutDashboard, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import UserProfileDropdown from './UserProfileDropdown.jsx';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock.js';
import {
  clearLandingHash,
  LANDING_NAV_ITEMS,
  setLandingHash,
} from '@/utils/landingNavigation.js';

const navLinkClass =
  'nav-link text-gray-700 hover:text-syntix-green font-medium transition-colors';
const mobileNavLinkClass =
  'nav-link flex min-h-11 items-center rounded-lg px-3 py-2 text-gray-700 font-medium transition-colors hover:bg-gray-50 hover:text-syntix-green';
const mobileUserActionClass =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-white hover:text-syntix-navy';

export default function PublicHeader({ onLoginClick, onRegisterClick }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingLandingTarget, setPendingLandingTarget] = useState(null);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useBodyScrollLock(isMobileMenuOpen);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  const handleLoginClick = () => {
    closeMobileMenu();
    onLoginClick();
  };

  const handleRegisterClick = () => {
    closeMobileMenu();
    onRegisterClick();
  };

  const handleLogoClick = (event) => {
    if (location.pathname !== '/') return;

    if (location.hash) {
      event.preventDefault();

      if (isMobileMenuOpen) {
        setPendingLandingTarget('top');
        closeMobileMenu();
        return;
      }

      closeMobileMenu();
      clearLandingHash();
    }
  };

  const handleInicioClick = (event) => {
    event.preventDefault();
    closeMobileMenu();

    if (location.pathname !== '/') {
      navigate('/');
      return;
    }

    if (isMobileMenuOpen) {
      setPendingLandingTarget('top');
      return;
    }

    clearLandingHash();
  };

  const handleSectionClick = (event, sectionId) => {
    event.preventDefault();
    closeMobileMenu();

    if (location.pathname !== '/') {
      navigate({ pathname: '/', hash: `#${sectionId}` });
      return;
    }

    if (isMobileMenuOpen) {
      setPendingLandingTarget(sectionId);
      return;
    }

    setLandingHash(sectionId);
  };

  const handleMobileRouteClick = (path) => {
    closeMobileMenu();
    navigate(path);
  };

  const handleMobileLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/', { replace: true });
  };

  const renderNavItem = (item, className) => {
    if (!item.sectionId) {
      return (
        <a key={item.label} href={item.href} onClick={handleInicioClick} className={className}>
          {item.label}
        </a>
      );
    }

    return (
      <a
        key={item.label}
        href={item.href}
        onClick={(event) => handleSectionClick(event, item.sectionId)}
        className={className}
      >
        {item.label}
      </a>
    );
  };

  useEffect(() => {
    if (!isMobileMenuOpen || typeof window === 'undefined') return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (event) => {
      if (event.matches) {
        closeMobileMenu();
      }
    };

    if (mediaQuery.matches) {
      closeMobileMenu();
      return undefined;
    }

    document.addEventListener('keydown', handleKeyDown);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [closeMobileMenu, isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen || !pendingLandingTarget || typeof window === 'undefined') {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (pendingLandingTarget === 'top') {
        clearLandingHash();
      } else {
        setLandingHash(pendingLandingTarget);
      }

      setPendingLandingTarget(null);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isMobileMenuOpen, pendingLandingTarget]);

  const initial = user?.empresa ? user.empresa.charAt(0).toUpperCase() : 'U';
  const headerZIndexClass = isMobileMenuOpen ? 'z-[80]' : 'z-40';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 border-b border-gray-100 bg-white/90 backdrop-blur-md ${headerZIndexClass}`}>
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                onClick={handleLogoClick}
                className="font-extrabold text-2xl tracking-tight text-syntix-navy"
              >
                SYNTIX <span className="text-syntix-green">TECH</span>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              {LANDING_NAV_ITEMS.map((item) => renderNavItem(item, navLinkClass))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <UserProfileDropdown variant="light" />
              ) : (
                <>
                  <button type="button" onClick={handleLoginClick} className="text-syntix-navy font-medium hover:text-syntix-green transition-colors">
                    Iniciar Sesion
                  </button>
                  <button type="button" onClick={handleRegisterClick} className="bg-syntix-navy text-white px-5 py-2.5 rounded-lg font-medium hover:bg-syntix-navy/90 transition-colors shadow-md shadow-syntix-navy/20">
                    Registrarse
                  </button>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
                aria-label={isMobileMenuOpen ? 'Cerrar menu principal' : 'Abrir menu principal'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="public-mobile-menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[70] bg-syntix-navy/35 backdrop-blur-[1px] md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {isMobileMenuOpen && (
        <div
          id="public-mobile-menu"
          data-scroll-lock-allow="true"
          className="ios-touch-scroll fixed inset-x-0 bottom-0 top-20 z-[75] overflow-y-auto overflow-x-hidden overscroll-contain bg-white px-4 pb-6 pt-3 shadow-2xl md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
          <nav className="space-y-1" aria-label="Navegacion principal movil">
            {LANDING_NAV_ITEMS.map((item) => renderNavItem(item, mobileNavLinkClass))}
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
            {isAuthenticated ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3 border-b border-gray-200 pb-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-syntix-green text-lg font-bold text-white shadow-sm">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-syntix-navy">{user?.empresa}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleMobileRouteClick('/perfil')}
                    className={mobileUserActionClass}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileRouteClick('/dashboard')}
                    className={mobileUserActionClass}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileRouteClick('/configuracion')}
                    className={mobileUserActionClass}
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    Configuracion
                  </button>
                  <button
                    type="button"
                    onClick={handleMobileLogout}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-syntix-red transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Cerrar Sesion
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" onClick={handleLoginClick} className="min-h-11 w-full rounded-lg border border-syntix-navy py-2 font-medium text-syntix-navy">
                  Iniciar Sesion
                </button>
                <button type="button" onClick={handleRegisterClick} className="min-h-11 w-full rounded-lg bg-syntix-navy py-2 font-medium text-white">
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

PublicHeader.propTypes = {
  onLoginClick: PropTypes.func.isRequired,
  onRegisterClick: PropTypes.func.isRequired,
};
