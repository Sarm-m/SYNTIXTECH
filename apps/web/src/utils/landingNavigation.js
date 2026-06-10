/**
 * Navegación por anclas en la landing (scroll + hash sin recarga).
 */

/** Ids de sección usados en HomePage, header y hashes de URL. */
export const LANDING_SECTION_IDS = {
  beneficios: 'beneficios',
  funciones: 'funciones',
  seguridad: 'seguridad',
  contacto: 'contacto',
};

export const LANDING_NAV_ITEMS = [
  { label: 'Inicio', sectionId: null, href: '/' },
  { label: 'Funciones', sectionId: LANDING_SECTION_IDS.funciones, href: '/#funciones' },
  { label: 'Beneficios', sectionId: LANDING_SECTION_IDS.beneficios, href: '/#beneficios' },
  { label: 'Seguridad', sectionId: LANDING_SECTION_IDS.seguridad, href: '/#seguridad' },
  { label: 'Contacto', sectionId: LANDING_SECTION_IDS.contacto, href: '/#contacto' },
];

export function scrollToSection(sectionId) {
  if (typeof document === 'undefined') return false;

  const element = document.getElementById(sectionId);
  if (!element) return false;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
  return true;
}

/** Alias explícito para scroll a secciones de la landing. */
export function scrollToLandingSection(sectionId) {
  return scrollToSection(sectionId);
}

export function scrollToTop() {
  if (typeof window === 'undefined') return;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Limpia el hash y deja la URL en la ruta actual (p. ej. `/`). */
export function clearLandingHash() {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname || '/';
  if (window.location.hash) {
    window.history.replaceState(null, '', path);
  }
  scrollToTop();
}

/** Actualiza el hash y hace scroll a la sección en la misma página. */
export function setLandingHash(sectionId) {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname || '/';
  window.history.replaceState(null, '', `${path}#${sectionId}`);
  scrollToSection(sectionId);
}

/** Aplica scroll según hash de React Router o del navegador. */
export function applyLandingHashFromLocation(hash) {
  const id = (hash || '').replace(/^#/, '');
  if (!id) return;

  if (id === 'inicio') {
    clearLandingHash();
    return;
  }

  scrollToSection(id);
}
