import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import UserProfileDropdown from './UserProfileDropdown.jsx';
import {
  clearLandingHash,
  LANDING_NAV_ITEMS,
  setLandingHash,
} from '@/utils/landingNavigation.js';

const navLinkClass =
  'nav-link text-gray-700 hover:text-syntix-green font-medium transition-colors';
const mobileNavLinkClass =
  'nav-link block text-gray-700 font-medium py-2';

// Cabecera de la zona pública: mezcla navegación de marketing con accesos de autenticación.
export default function PublicHeader({ onLoginClick, onRegisterClick }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogoClick = (event) => {
    if (location.pathname !== '/') return;

    if (location.hash) {
      event.preventDefault();
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

    clearLandingHash();
  };

  const handleSectionClick = (event, sectionId) => {
    event.preventDefault();
    closeMobileMenu();

    if (location.pathname !== '/') {
      navigate({ pathname: '/', hash: `#${sectionId}` });
      return;
    }

    setLandingHash(sectionId);
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

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <button onClick={onLoginClick} className="text-syntix-navy font-medium hover:text-syntix-green transition-colors">
                  Iniciar Sesión
                </button>
                <button onClick={onRegisterClick} className="bg-syntix-navy text-white px-5 py-2.5 rounded-lg font-medium hover:bg-syntix-navy/90 transition-colors shadow-md shadow-syntix-navy/20">
                  Registrarse
                </button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-4 shadow-lg">
          {LANDING_NAV_ITEMS.map((item) => renderNavItem(item, mobileNavLinkClass))}

          <div className="pt-4 flex flex-col gap-3 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="flex justify-center py-2">
                <UserProfileDropdown variant="light" />
              </div>
            ) : (
              <>
                <button onClick={onLoginClick} className="w-full border border-syntix-navy text-syntix-navy py-2 rounded-lg font-medium">
                  Iniciar Sesión
                </button>
                <button onClick={onRegisterClick} className="w-full bg-syntix-navy text-white py-2 rounded-lg font-medium">
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

PublicHeader.propTypes = {
  onLoginClick: PropTypes.func.isRequired,
  onRegisterClick: PropTypes.func.isRequired,
};
