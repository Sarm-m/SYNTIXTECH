import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LayoutDashboard, LogOut, Menu, PlayCircle, Settings, User, X } from 'lucide-react';
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
  'nav-link text-sm font-medium text-slate-300 transition-colors hover:text-white';
const mobileNavLinkClass =
  'nav-link flex min-h-11 items-center rounded-xl px-3 py-2 text-slate-200 font-semibold transition-colors hover:bg-white/[0.06] hover:text-white';
const mobileUserActionClass =
  'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white';

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

    const mediaQuery = window.matchMedia('(min-width: 1280px)');
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
      <header className={`fixed left-0 right-0 top-0 border-b border-white/[0.08] bg-[#020817]/90 shadow-lg shadow-black/10 backdrop-blur-xl ${headerZIndexClass}`}>
        <div className="relative z-30 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                onClick={handleLogoClick}
                className="group flex items-center gap-3 text-xl font-extrabold tracking-tight text-slate-100 sm:text-2xl"
              >
                <span className="syntix-logo-mark" aria-hidden="true"><span /><span /></span>
                <span>SYNTIX <span className="text-blue-400">TECH</span></span>
              </Link>
            </div>

            <nav className="hidden items-center space-x-6 xl:flex 2xl:space-x-9">
              {LANDING_NAV_ITEMS.map((item) => renderNavItem(item, navLinkClass))}
            </nav>

            <div className="hidden items-center gap-2 xl:flex">
              {isAuthenticated ? (
                <UserProfileDropdown variant="dark" />
              ) : (
                <>
                  <Link to="/demo/dashboard" className="landing-header-action">
                    <PlayCircle className="h-4 w-4" /> Ver demo
                  </Link>
                  <button type="button" onClick={handleLoginClick} className="landing-header-action">
                    <User className="h-4 w-4" />
                    Iniciar sesión
                  </button>
                  <button type="button" onClick={handleRegisterClick} className="landing-register-action">
                    Registrarse
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center xl:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-blue-300/25 hover:bg-white/[0.08] hover:text-white"
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
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] xl:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {isMobileMenuOpen && (
        <div
          id="public-mobile-menu"
          data-scroll-lock-allow="true"
          className="ios-touch-scroll fixed inset-x-0 bottom-0 top-20 z-[75] overflow-y-auto overflow-x-hidden overscroll-contain border-t border-white/[0.06] bg-[#050d1a] px-4 pb-6 pt-3 shadow-2xl xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
          <nav className="space-y-1" aria-label="Navegacion principal movil">
            {LANDING_NAV_ITEMS.map((item) => renderNavItem(item, mobileNavLinkClass))}
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
            {isAuthenticated ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3 border-b border-white/10 pb-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-syntix-blue text-lg font-bold text-white shadow-sm">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{user?.empresa}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
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
                    Configuración
                  </button>
                  <button
                    type="button"
                    onClick={handleMobileLogout}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-400 transition-colors hover:bg-red-400/10"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" onClick={() => handleMobileRouteClick('/demo/dashboard')} className="landing-secondary-cta w-full">
                  Ver demo
                </button>
                <button type="button" onClick={handleLoginClick} className="landing-secondary-cta w-full">
                  Iniciar sesión
                </button>
                <button type="button" onClick={handleRegisterClick} className="landing-primary-cta w-full">
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
