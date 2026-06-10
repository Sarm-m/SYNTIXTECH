import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  applyLandingHashFromLocation,
  clearLandingHash,
  LANDING_NAV_ITEMS,
  LANDING_SECTION_IDS,
  scrollToLandingSection,
  scrollToSection,
  setLandingHash,
} from '@/utils/landingNavigation.js';

const SECTION_IDS = ['beneficios', 'funciones', 'seguridad', 'contacto'];

const createLandingBrowserMocks = () => {
  const sections = new Map(
    SECTION_IDS.map((id) => [id, { id, scrollIntoView: vi.fn() }])
  );

  const location = {
    pathname: '/',
    hash: '',
  };

  const windowMock = {
    location,
    history: {
      replaceState: vi.fn((_state, _title, url) => {
        const urlStr = String(url);
        const hashIndex = urlStr.indexOf('#');

        if (hashIndex >= 0) {
          location.pathname = urlStr.slice(0, hashIndex) || '/';
          location.hash = urlStr.slice(hashIndex);
          return;
        }

        location.pathname = urlStr || '/';
        location.hash = '';
      }),
    },
    scrollTo: vi.fn(),
  };

  const documentMock = {
    getElementById: vi.fn((id) => sections.get(id) || null),
    body: { innerHTML: '' },
  };

  return { sections, windowMock, documentMock };
};

describe('landingNavigation', () => {
  it('LANDING_NAV_ITEMS mantiene el orden comercial del header', () => {
    expect(LANDING_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Inicio',
      'Funciones',
      'Beneficios',
      'Seguridad',
      'Contacto',
    ]);
  });

  beforeEach(() => {
    const { windowMock, documentMock } = createLandingBrowserMocks();
    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('document', documentMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('scrollToSection llama scrollIntoView cuando existe el id', () => {
    const element = document.getElementById('funciones');
    scrollToSection('funciones');
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('scrollToLandingSection delega en scrollToSection', () => {
    scrollToLandingSection('seguridad');
    expect(document.getElementById('seguridad').scrollIntoView).toHaveBeenCalled();
  });

  it('scrollToSection no lanza error si la sección no existe', () => {
    expect(() => scrollToSection('no-existe')).not.toThrow();
    expect(scrollToSection('no-existe')).toBe(false);
  });

  it('clearLandingHash elimina el hash y hace scroll al inicio', () => {
    window.history.replaceState(null, '', '/#inicio');
    clearLandingHash();
    expect(window.location.pathname).toBe('/');
    expect(window.location.hash).toBe('');
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('setLandingHash actualiza el hash y hace scroll a la sección', () => {
    setLandingHash('funciones');
    expect(window.location.hash).toBe('#funciones');
    expect(document.getElementById('funciones').scrollIntoView).toHaveBeenCalled();
  });

  it('applyLandingHashFromLocation trata #inicio como limpieza de hash', () => {
    window.history.replaceState(null, '', '/#inicio');
    applyLandingHashFromLocation('#inicio');
    expect(window.location.hash).toBe('');
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it.each([
    ['beneficios', LANDING_SECTION_IDS.beneficios],
    ['funciones', LANDING_SECTION_IDS.funciones],
    ['seguridad', LANDING_SECTION_IDS.seguridad],
    ['contacto', LANDING_SECTION_IDS.contacto],
  ])('applyLandingHashFromLocation hace scroll con #%s', (hashLabel, sectionId) => {
    applyLandingHashFromLocation(`#${hashLabel}`);
    expect(document.getElementById(sectionId).scrollIntoView).toHaveBeenCalled();
  });

  it('applyLandingHashFromLocation ignora hash desconocido sin error', () => {
    expect(() => applyLandingHashFromLocation('#desconocido')).not.toThrow();
  });
});
