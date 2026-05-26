import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  default: apiMock,
}));

import {
  BACKUP_VERSION,
  EXCEL_SHEET_NAMES,
  MAX_RECORDS_PER_ENTITY,
  buildBackupPayload,
  buildBackupFileName,
  buildBackupTemplatePayload,
  buildExcelWorkbook,
  buildSampleBackupPayload,
  downloadExcelBackup,
  downloadJsonBackup,
  exportLocalPreferences,
  exportOperationalBackup,
  importOperationalBackup,
  normalizeBackupPayload,
  normalizeBackupPreferences,
  parseExcelBackup,
  parseJsonBackup,
  resetOperationalData,
  sanitizeBackupPayload,
  serializeJsonBackup,
  summarizeBackupPayload,
  validateBackupPayload,
} from '../utils/dataBackup.js';

const normalizeKey = (key) =>
  String(key)
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const collectKeys = (value, keys = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }

  if (!value || typeof value !== 'object') {
    return keys;
  }

  Object.entries(value).forEach(([key, fieldValue]) => {
    keys.push(normalizeKey(key));
    collectKeys(fieldValue, keys);
  });

  return keys;
};

const expectNoSensitiveOrOwnershipFields = (value) => {
  const keys = collectKeys(value);
  expect(keys).not.toEqual(expect.arrayContaining([
    'password',
    'token',
    'jwt',
    'accesstoken',
    'refreshtoken',
    'secret',
    'clientsecret',
    'emailpass',
    'twilioauthtoken',
    'mongouri',
    'jwtsecret',
    'env',
    'owneremail',
    'ownerempresa',
  ]));
};

const createLocalStorageMock = (initialValues = {}) => {
  const storage = {};

  Object.entries(initialValues).forEach(([key, value]) => {
    storage[key] = String(value);
  });

  Object.defineProperties(storage, {
    getItem: {
      value: vi.fn((key) => (
        Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null
      )),
    },
    setItem: {
      value: vi.fn((key, value) => {
        storage[key] = String(value);
      }),
    },
    removeItem: {
      value: vi.fn((key) => {
        delete storage[key];
      }),
    },
  });

  return storage;
};

const validBackup = (overrides = {}) => ({
  version: BACKUP_VERSION,
  vehiculos: [{ placa: 'ABC123', marca: 'Toyota', modelo: 'Hilux', anio: 2026, tipo: 'Camioneta' }],
  conductores: [],
  soats: [],
  rtms: [],
  validaciones: [],
  ...overrides,
});

const excelSerialForDate = (dateText) => {
  const [year, month, day] = dateText.split('-').map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(1899, 11, 30)) / 86400000);
};

const buildBulkExcelLikePayload = () => ({
  version: BACKUP_VERSION,
  conductores: Array.from({ length: 50 }, (_, index) => {
    const documentNumber = String(1000000001 + index);
    return {
      nombre: `Conductor DCV ${String(index + 1).padStart(2, '0')}`,
      documento: `CC${documentNumber}`,
      telefono: index === 0 ? '+57 3001110000' : String(3001110000 + index),
      categoria: ['B1', 'C1', 'C2', 'C3'][index % 4],
      fechaVencimiento: index === 0 ? excelSerialForDate('2026-05-22') : '2026-12-31',
    };
  }),
  vehiculos: Array.from({ length: 50 }, (_, index) => {
    const placa = `DCV${101 + index}`;
    return {
      placa,
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2026,
      tipo: 'Pickup',
      conductorDocumento: `CC${1000000001 + index}`,
    };
  }),
  soats: Array.from({ length: 50 }, (_, index) => {
    const placa = `DCV${101 + index}`;
    return {
      placa,
      numeroPoliza: `SOAT-${placa}-2026`,
      aseguradora: 'SURA',
      fechaExpedicion: '2025-05-22',
      fechaInicioVigencia: '2025-05-22',
      fechaFinVigencia: '2026-05-22',
    };
  }),
  rtms: Array.from({ length: 50 }, (_, index) => {
    const placa = `DCV${101 + index}`;
    return {
      placa,
      numeroCertificado: `RTM-${placa}-2026`,
      cda: 'CDA Central',
      nitCda: `900100${String(index).padStart(3, '0')}-1`,
      fechaExpedicion: '2025-05-22',
      fechaVencimiento: index === 1 ? excelSerialForDate('2026-05-22') : '2026-05-22',
      resultado: index % 9 === 0 ? 'Requiere seguimiento' : 'Aprobado',
      observaciones: index % 9 === 0 ? 'Revisar observaciones antes de operar' : '',
    };
  }),
  validaciones: [],
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('validateBackupPayload', () => {
  it('rechaza archivos que no son objetos JSON validos', () => {
    expect(validateBackupPayload(null)).toMatchObject({
      valid: false,
      errors: ['El archivo no es un objeto JSON valido.'],
    });
    expect(validateBackupPayload([]).valid).toBe(false);
  });

  it('rechaza archivos sin version o sin datos operativos', () => {
    const result = validateBackupPayload({ vehiculos: [] });

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/version/i);
    expect(result.errors.join(' ')).toMatch(/datos operativos/i);
  });

  it('rechaza campos sensibles en cualquier nivel del respaldo', () => {
    const result = validateBackupPayload(validBackup({
      vehiculos: [{
        placa: 'ABC123',
        auditoria: {
          accessToken: 'abc',
          clientSecret: 'secret',
          EMAIL_PASS: 'mail-pass',
          '.env': 'JWT_SECRET=bad',
        },
      }],
    }));

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/sensibles/i);
  });

  it('rechaza secciones operativas que no sean arreglos', () => {
    const result = validateBackupPayload({
      version: BACKUP_VERSION,
      vehiculos: { placa: 'ABC123' },
      preferences: { syntix_threshold: '20' },
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/vehiculos debe ser un arreglo/i);
  });

  it('rechaza respaldos que superan el maximo de registros permitido', () => {
    const result = validateBackupPayload(validBackup({
      vehiculos: Array.from({ length: MAX_RECORDS_PER_ENTITY + 1 }, (_, index) => ({
        placa: `ABC${String(index).padStart(3, '0')}`,
      })),
    }));

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(new RegExp(String(MAX_RECORDS_PER_ENTITY)));
  });

  it('rechaza preferencias con tipo invalido y aplica limite documental de 1000 registros', () => {
    const result = validateBackupPayload({
      version: BACKUP_VERSION,
      vehiculos: [{ placa: 'ABC123' }],
      preferences: [],
      soats: Array.from({ length: 1001 }, (_, index) => ({
        placaVehiculo: 'ABC123',
        numeroPoliza: `SOAT-${index}`,
        fechaInicioVigencia: '2026-01-01',
        fechaFinVigencia: '2026-12-31',
      })),
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/preferences/i);
    expect(result.errors.join(' ')).toMatch(/1000/);
  });

  it('acepta respaldos operativos validos y preferencias sin entidades', () => {
    expect(validateBackupPayload(validBackup()).valid).toBe(true);

    const preferencesOnly = validateBackupPayload({
      version: BACKUP_VERSION,
      preferences: { syntix_threshold: '15' },
    });

    expect(preferencesOnly).toMatchObject({ valid: true, errors: [] });
  });

  it('reporta placas duplicadas, fechas invalidas y documentos asociados a placa inexistente', () => {
    const result = validateBackupPayload({
      version: BACKUP_VERSION,
      vehiculos: [
        { placa: '' },
        { placa: '@@@' },
        { placa: 'ABC123', anio: '2026' },
        { placa: 'ABC123', anio: 'dos mil' },
      ],
      conductores: [
        { nombre: '', documento: '1000000001', categoria: '', fechaVencimiento: '2026-02-30' },
        { nombre: 'Duplicado', documento: '1000000001', categoria: 'B1', fechaVencimiento: '2026-12-31' },
      ],
      soats: [{ placaVehiculo: 'ZZZ999', numeroPoliza: '', fechaFinVigencia: 'fecha' }],
      rtms: [{ placaVehiculo: '', fechaVencimiento: '2026-05-22' }],
    });

    expect(result.valid).toBe(false);
    expect(result.recordErrors.map((error) => error.message).join(' ')).toMatch(/duplicada/i);
    expect(result.recordErrors.map((error) => error.message).join(' ')).toMatch(/ABC123/i);
    expect(result.recordErrors.map((error) => error.message).join(' ')).toMatch(/fechaVencimiento/i);
    expect(result.recordErrors.map((error) => error.message).join(' ')).toMatch(/no existe/i);
  });
});

describe('sanitizeBackupPayload', () => {
  it('elimina credenciales y ownership de forma recursiva sin tocar datos operativos', () => {
    const sanitized = sanitizeBackupPayload({
      ownerEmail: 'otra-persona@example.com',
      ownerEmpresa: 'Empresa Externa',
      vehiculos: [{
        placa: 'ABC123',
        password: 'bad',
        token: 'bad',
        jwt: 'bad',
        accessToken: 'bad',
        refreshToken: 'bad',
        secret: 'bad',
        clientSecret: 'bad',
        EMAIL_PASS: 'bad',
        TWILIO_AUTH_TOKEN: 'bad',
        MONGO_URI: 'bad',
        JWT_SECRET: 'bad',
        '.env': 'bad',
        metadata: {
          safe: 'ok',
          nestedToken: 'bad',
        },
      }],
    });

    expect(sanitized).toEqual({
      vehiculos: [{
        placa: 'ABC123',
        metadata: { safe: 'ok' },
      }],
    });
    expectNoSensitiveOrOwnershipFields(sanitized);
  });

  it('mantiene valores primitivos y arreglos vacios', () => {
    expect(sanitizeBackupPayload('texto')).toBe('texto');
    expect(sanitizeBackupPayload(null)).toBeNull();
    expect(sanitizeBackupPayload([])).toEqual([]);
  });
});

describe('exportLocalPreferences', () => {
  it('retorna objeto vacio cuando no hay localStorage disponible', () => {
    expect(exportLocalPreferences()).toEqual({});
  });

  it('exporta solo preferencias locales permitidas', () => {
    const storage = createLocalStorageMock({
      syntix_threshold: '20',
      syntix_dark_mode: 'true',
      syntix_token: 'jwt-privado',
    });
    vi.stubGlobal('localStorage', storage);

    expect(exportLocalPreferences()).toEqual({
      syntix_threshold: '20',
      syntix_dark_mode: 'true',
    });
  });
});

describe('exportOperationalBackup', () => {
  it('requiere un usuario autenticado para exportar', async () => {
    await expect(exportOperationalBackup()).rejects.toThrow(/usuario autenticado/i);
    expect(apiMock.get).not.toHaveBeenCalled();
  });

  it('construye un respaldo operativo valido sin credenciales ni ownership', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T12:34:56.000Z'));
    vi.stubGlobal('localStorage', createLocalStorageMock({
      syntix_threshold: '30',
      syntix_dark_mode: 'false',
      syntix_token: 'jwt-privado',
    }));

    const responsesByEndpoint = {
      '/vehiculos': {
        data: [{
          _id: 'veh-1',
          placa: 'ABC123',
          marca: 'Toyota',
          modelo: 'Hilux',
          anio: 2026,
          tipo: 'Camioneta',
          conductorId: 'cond-1',
          ownerEmail: 'otra-persona@example.com',
          token: 'bad',
        }],
      },
      '/conductores': {
        data: [{
          _id: 'cond-1',
          nombre: 'Laura Perez',
          documento: '1234567890',
          telefono: '3001234567',
          categoria: 'B1',
          fechaVencimiento: '2026-12-31',
          password: 'bad',
          ownerEmail: 'otra-persona@example.com',
        }],
      },
      '/soats': {
        data: [{
          placa: 'ABC123',
          numeroPoliza: 'SOAT-001',
          aseguradora: 'SURA',
          fechaExpedicion: '2026-01-01',
          fechaInicio: '2026-01-01',
          fechaVencimiento: '2026-12-31',
          accessToken: 'bad',
        }],
      },
      '/rtms': {
        data: [{
          vehiculoPlaca: 'ABC123',
          numeroCertificado: 'RTM-001',
          cda: 'CDA Norte',
          nitCda: '900123456',
          fechaExpedicion: '2026-01-01',
          fechaVencimiento: '2026-12-31',
          resultado: 'Aprobado',
          clientSecret: 'bad',
        }],
      },
      '/validaciones': {
        data: [{
          _id: 'val-1',
          placa: 'ABC123',
          resultado: 'vigente',
          ownerEmail: 'otra-persona@example.com',
          nested: {
            safe: 'ok',
            jwt: 'bad',
          },
          EMAIL_PASS: 'bad',
          MONGO_URI: 'bad',
        }],
      },
    };

    apiMock.get.mockImplementation(async (endpoint, options) => {
      expect(options).toEqual({ params: { email: 'usuario@example.com' } });
      return responsesByEndpoint[endpoint];
    });

    const backup = await exportOperationalBackup('usuario@example.com');

    expect(apiMock.get).toHaveBeenCalledTimes(5);
    expect(backup).toMatchObject({
      version: BACKUP_VERSION,
      exportedAt: '2026-05-22T12:34:56.000Z',
      vehiculos: [{
        placa: 'ABC123',
        marca: 'Toyota',
        modelo: 'Hilux',
        anio: 2026,
        tipo: 'Camioneta',
        conductorDocumento: '1234567890',
      }],
      conductores: [{
        nombre: 'Laura Perez',
        documento: '1234567890',
        telefono: '3001234567',
        categoria: 'B1',
        fechaVencimiento: '2026-12-31',
      }],
      soats: [{
        placaVehiculo: 'ABC123',
        numeroPoliza: 'SOAT-001',
        aseguradora: 'SURA',
        fechaExpedicion: '2026-01-01',
        fechaInicioVigencia: '2026-01-01',
        fechaFinVigencia: '2026-12-31',
        observaciones: '',
      }],
      rtms: [{
        placaVehiculo: 'ABC123',
        numeroCertificado: 'RTM-001',
        cda: 'CDA Norte',
        nitCda: '900123456',
        fechaExpedicion: '2026-01-01',
        fechaVencimiento: '2026-12-31',
        resultado: 'Aprobado',
        observaciones: '',
      }],
      validaciones: [{
        _id: 'val-1',
        placa: 'ABC123',
        resultado: 'vigente',
        nested: { safe: 'ok' },
      }],
      preferences: {
        syntix_threshold: '30',
        syntix_dark_mode: 'false',
      },
    });
    expect(backup.notes).toMatch(/alertas no se exportan/i);
    expectNoSensitiveOrOwnershipFields(backup);
  });
});

describe('buildBackupPayload y JSON', () => {
  it('asocia SOAT y RTM por vehiculoId cuando el backend no trae placa directa', () => {
    const payload = buildBackupPayload({
      exportedAt: '2026-05-22T00:00:00.000Z',
      vehiculos: [{ _id: 'veh-1', placa: 'abc123', marca: 'Toyota', modelo: 'Hilux', anio: 2026, tipo: 'Pickup' }],
      conductores: [],
      soats: [{ vehiculoId: 'veh-1', numeroPoliza: 'SOAT-001', fechaInicioVigencia: '2026-01-01', fechaFinVigencia: '2026-12-31' }],
      rtms: [{ vehiculoId: 'veh-1', numeroCertificado: 'RTM-001', fechaVencimiento: '2026-12-31' }],
      preferences: { syntix_simulated_date: '"2026-05-22"', syntix_token: 'privado' },
    });

    expect(payload.vehiculos[0].placa).toBe('ABC123');
    expect(payload.soats[0].placaVehiculo).toBe('ABC123');
    expect(payload.rtms[0].placaVehiculo).toBe('ABC123');
    expect(payload.preferences).toEqual({ syntix_simulated_date: '2026-05-22' });
    expectNoSensitiveOrOwnershipFields(payload);
  });

  it('parseJsonBackup normaliza preferencias antiguas y rechaza JSON mal formado', () => {
    const parsed = parseJsonBackup(JSON.stringify({
      version: BACKUP_VERSION,
      preferences: {
        syntix_threshold: 15,
        syntix_simulated_date: '"2026-05-22"',
        syntix_dark_mode: true,
        syntix_sidebar_width: '280',
      },
    }));

    expect(parsed.preferences).toEqual({
      syntix_threshold: '15',
      syntix_simulated_date: '2026-05-22',
      syntix_dark_mode: 'true',
    });
    expect(() => parseJsonBackup('{')).toThrow(/mal formado/i);
  });

  it('summarizeBackupPayload retorna conteos y errores de validacion por registro', () => {
    const summary = summarizeBackupPayload({
      version: BACKUP_VERSION,
      vehiculos: [{ placa: 'ABC123' }, { placa: 'ABC123' }],
      conductores: [],
      soats: [{ placa: '', numeroPoliza: '' }],
      rtms: [],
    });

    expect(summary).toMatchObject({
      vehiculos: 2,
      soats: 1,
      valid: false,
    });
    expect(summary.recordErrors.map((error) => error.entity)).toEqual(expect.arrayContaining(['vehiculos', 'soats']));
  });

  it('normalizeBackupPreferences solo conserva claves permitidas', () => {
    expect(normalizeBackupPreferences({
      syntix_threshold: 20,
      syntix_simulated_date: '"2026-05-22"',
      syntix_dark_mode: false,
      syntix_token: 'privado',
    })).toEqual({
      syntix_threshold: '20',
      syntix_simulated_date: '2026-05-22',
      syntix_dark_mode: 'false',
    });
    expect(normalizeBackupPreferences(null)).toEqual({});
  });

  it('normalize payload conserva alias de documentos y validaciones sin credenciales', () => {
    const parsed = parseJsonBackup(JSON.stringify({
      vehiculos: [{ placa: 'abc123' }],
      conductores: [{}],
      soats: [{
        vehiculoPlaca: 'abc123',
        fechaInicio: '2026-01-01T00:00:00.000Z',
        fechaVencimiento: '2026-12-31T00:00:00.000Z',
      }],
      rtms: [{ vehiculoPlaca: 'abc123' }],
      validaciones: [{
        placaVehiculo: 'abc123',
        type: 'RUNT',
        status: 'vigente',
        createdAt: '2026-05-22T00:00:00.000Z',
        detalle: 'Sin novedades',
      }],
      preferences: null,
    }));

    expect(parsed.version).toBe(BACKUP_VERSION);
    expect(parsed.soats[0]).toMatchObject({
      placaVehiculo: 'ABC123',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2026-12-31',
    });
    expect(parsed.rtms[0].placaVehiculo).toBe('ABC123');
    expect(parsed.validaciones[0]).toEqual({
      placa: 'ABC123',
      tipo: 'RUNT',
      estado: 'vigente',
      fecha: '2026-05-22',
      observaciones: 'Sin novedades',
    });
  });
});

describe('importOperationalBackup', () => {
  it('normaliza documentos CC, telefonos con +57, fechas seriales y resultado RTM de seguimiento', () => {
    const normalized = normalizeBackupPayload(buildBulkExcelLikePayload());

    expect(normalized.conductores).toHaveLength(50);
    expect(normalized.vehiculos).toHaveLength(50);
    expect(normalized.rtms).toHaveLength(50);
    expect(normalized.conductores[0]).toMatchObject({
      documento: '1000000001',
      telefono: '3001110000',
      fechaVencimiento: '2026-05-22',
    });
    expect(normalized.vehiculos[0].conductorDocumento).toBe('1000000001');
    expect(normalized.rtms[0]).toMatchObject({
      resultado: 'Pendiente',
      fechaExpedicion: '2025-05-22',
    });
    expect(normalized.rtms[1].fechaVencimiento).toBe('2026-05-22');
    expect(validateBackupPayload(normalized)).toMatchObject({
      valid: true,
      recordErrors: [],
    });
  });

  it('rechaza resultado RTM desconocido con hoja y fila claras', () => {
    const result = validateBackupPayload(validBackup({
      rtms: [{
        placa: 'ABC123',
        numeroCertificado: 'RTM-ABC123-2026',
        cda: 'CDA Central',
        fechaExpedicion: '2025-05-22',
        fechaVencimiento: '2026-05-22',
        resultado: 'Suspendido',
      }],
    }));

    expect(result.valid).toBe(false);
    expect(result.recordErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sheet: 'RTM',
        rowNumber: 2,
        message: expect.stringMatching(/resultado Suspendido no es reconocido/i),
      }),
    ]));
  });

  it('rechaza respaldos invalidos antes de llamar la API', async () => {
    await expect(importOperationalBackup(validBackup({
      vehiculos: [{ placa: 'ABC123', token: 'bad' }],
    }))).rejects.toThrow(/sensibles/i);

    expect(apiMock.post).not.toHaveBeenCalled();
  });

  it('importa datos operativos normalizando placas, ownership y preferencias permitidas', async () => {
    const storage = createLocalStorageMock();
    vi.stubGlobal('localStorage', storage);

    apiMock.post.mockImplementation(async (endpoint) => {
      if (endpoint === '/conductores') {
        return { data: { _id: 'cond-importado' } };
      }

      if (endpoint === '/vehiculos') {
        return { data: { id: 'veh-importado' } };
      }

      return { data: { id: 'doc-importado' } };
    });

    const summary = await importOperationalBackup({
      version: BACKUP_VERSION,
      ownerEmail: 'otra-persona@example.com',
      conductores: [{
        nombre: 'Laura Perez',
        documento: '1234567890',
        telefono: '3001234567',
        categoria: 'B1',
        fechaVencimiento: '2026-12-31',
        ownerEmail: 'otra-persona@example.com',
      }],
      vehiculos: [{
        placa: ' abc-123 ',
        marca: 'Toyota',
        modelo: 'Hilux',
        anio: '2026',
        conductorDocumento: '1234567890',
        ownerEmpresa: 'Empresa Externa',
      }],
      soats: [{
        placa: 'ABC123',
        numeroPoliza: 'SOAT-001',
        aseguradora: 'SURA',
        fechaExpedicion: '2026-01-01',
        fechaInicioVigencia: '2026-01-01',
        fechaFinVigencia: '2026-12-31',
      }],
      rtms: [{
        vehiculoPlaca: 'ABC123',
        numeroCertificado: 'RTM-001',
        cda: 'CDA Norte',
        nitCda: '900123456',
        fechaExpedicion: '2026-01-01',
        fechaVencimiento: '2026-12-31',
        resultado: 'Aprobado',
      }],
      preferences: {
        syntix_threshold: 25,
        syntix_simulated_date: '2026-05-22',
        syntix_dark_mode: false,
        syntix_sidebar_width: 'no-debe-importarse',
      },
    });

    expect(summary).toMatchObject({
      conductores: { processed: 1, errors: 0 },
      vehiculos: { processed: 1, errors: 0 },
      soats: { processed: 1, errors: 0 },
      rtms: { processed: 1, errors: 0 },
      errors: [],
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/conductores', {
      nombre: 'Laura Perez',
      documento: '1234567890',
      telefono: '3001234567',
      categoria: 'B1',
      fechaVencimiento: '2026-12-31',
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/vehiculos', {
      placa: 'ABC123',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2026,
      tipo: 'Otro',
      conductorId: 'cond-importado',
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(3, '/soats', expect.objectContaining({
      vehiculoId: 'veh-importado',
      placaVehiculo: 'ABC123',
      numeroPoliza: 'SOAT-001',
    }));
    expect(apiMock.post).toHaveBeenNthCalledWith(4, '/rtms', expect.objectContaining({
      vehiculoId: 'veh-importado',
      placaVehiculo: 'ABC123',
      numeroCertificado: 'RTM-001',
    }));
    apiMock.post.mock.calls.forEach(([, body]) => expectNoSensitiveOrOwnershipFields(body));
    expect(storage.setItem).toHaveBeenCalledWith('syntix_threshold', '25');
    expect(storage.setItem).toHaveBeenCalledWith('syntix_simulated_date', '2026-05-22');
    expect(storage.setItem).toHaveBeenCalledWith('syntix_dark_mode', 'false');
    expect(storage.syntix_sidebar_width).toBeUndefined();
  });

  it('importa 50 conductores, vehiculos, SOAT y RTM desde payload tipo Excel sin perder vinculaciones', async () => {
    apiMock.post.mockImplementation(async (endpoint, body) => {
      if (endpoint === '/conductores') {
        return { data: { _id: `cond-${body.documento}` } };
      }

      if (endpoint === '/vehiculos') {
        return { data: { _id: `veh-${body.placa}` } };
      }

      return { data: { _id: `doc-${body.placaVehiculo || body.numeroPoliza}` } };
    });

    const summary = await importOperationalBackup(buildBulkExcelLikePayload());

    expect(summary).toMatchObject({
      conductores: { processed: 50, errors: 0 },
      vehiculos: { processed: 50, errors: 0 },
      soats: { processed: 50, errors: 0 },
      rtms: { processed: 50, errors: 0 },
      errors: [],
    });
    expect(apiMock.post).toHaveBeenCalledTimes(200);
    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/conductores', expect.objectContaining({
      documento: '1000000001',
      telefono: '3001110000',
    }));
    expect(apiMock.post).toHaveBeenNthCalledWith(51, '/vehiculos', expect.objectContaining({
      placa: 'DCV101',
      conductorId: 'cond-1000000001',
    }));

    const rtmCalls = apiMock.post.mock.calls.filter(([endpoint]) => endpoint === '/rtms');
    expect(rtmCalls).toHaveLength(50);
    expect(rtmCalls.some(([, body]) => body.resultado === 'Pendiente')).toBe(true);
    expect(rtmCalls[0][1]).toEqual(expect.objectContaining({
      placaVehiculo: 'DCV101',
      resultado: 'Pendiente',
    }));
  });

  it('resume errores por registro sin detener toda la importacion', async () => {
    apiMock.post
      .mockRejectedValueOnce({ response: { data: { error: 'documento duplicado' } } })
      .mockRejectedValueOnce({ response: { data: { error: 'placa duplicada' } } });

    const summary = await importOperationalBackup({
      version: BACKUP_VERSION,
      conductores: [{
        nombre: 'Laura Perez',
        documento: '1234567890',
        telefono: '3001234567',
        categoria: 'B1',
        fechaVencimiento: '2026-12-31',
      }],
      vehiculos: [{ placa: 'ABC123', marca: 'Toyota', modelo: 'Hilux', anio: 2026 }],
      soats: [{
        placaVehiculo: 'ABC123',
        numeroPoliza: 'SOAT-ERR',
        fechaInicioVigencia: '2026-01-01',
        fechaFinVigencia: '2026-12-31',
      }],
      rtms: [{ placaVehiculo: 'ABC123', numeroCertificado: 'RTM-ERR', fechaVencimiento: '2026-12-31' }],
    });

    expect(summary.conductores.errors).toBe(1);
    expect(summary.vehiculos.errors).toBe(1);
    expect(summary.soats.errors).toBe(1);
    expect(summary.rtms.errors).toBe(1);
    expect(summary.errors.join(' ')).toContain('documento duplicado');
    expect(summary.errors.join(' ')).toContain('placa duplicada');
    expect(summary.errors.join(' ')).toContain('No existe vehiculo');
    expect(apiMock.post).toHaveBeenCalledTimes(2);
  });
});

describe('resetOperationalData', () => {
  it('requiere usuario autenticado para restablecer datos', async () => {
    await expect(resetOperationalData('')).rejects.toThrow(/usuario autenticado/i);
    expect(apiMock.get).not.toHaveBeenCalled();
    expect(apiMock.delete).not.toHaveBeenCalled();
  });

  it('borra solo datos operativos y conserva credenciales locales', async () => {
    const storage = createLocalStorageMock({
      syntix_threshold: '15',
      syntix_simulated_date: '2026-05-22',
      syntix_dark_mode: 'true',
      syntix_onboarding_dashboard: 'done',
      syntix_user: '{"email":"usuario@example.com"}',
      syntix_token: 'jwt-privado',
    });
    vi.stubGlobal('localStorage', storage);

    const recordsByEndpoint = {
      '/validaciones': [{ _id: 'val-1' }, { nombre: 'sin-id' }],
      '/soats': [{ id: 'soat-1' }],
      '/rtms': [{ _id: 'rtm-1' }],
      '/vehiculos': [{ id: 'veh-1' }],
      '/conductores': [{ _id: 'cond-1' }],
    };

    apiMock.get.mockImplementation(async (endpoint, options) => {
      expect(options).toEqual({ params: { email: 'usuario@example.com' } });
      return { data: recordsByEndpoint[endpoint] };
    });
    apiMock.delete.mockImplementation((url) => {
      if (url === '/rtms/rtm-1') {
        return Promise.reject({ response: { data: { error: 'RTM bloqueada' } } });
      }
      return Promise.resolve({});
    });

    const summary = await resetOperationalData('usuario@example.com');

    expect(apiMock.get).toHaveBeenCalledTimes(5);
    expect(apiMock.delete.mock.calls.map(([url]) => url)).toEqual([
      '/validaciones/val-1',
      '/soats/soat-1',
      '/rtms/rtm-1',
      '/vehiculos/veh-1',
      '/conductores/cond-1',
    ]);
    expect(apiMock.delete.mock.calls.map(([url]) => url).some((url) => url.startsWith('/auth'))).toBe(false);
    expect(summary).toMatchObject({
      validaciones: { processed: 1, errors: 0 },
      soats: { processed: 1, errors: 0 },
      rtms: { processed: 0, errors: 1 },
      vehiculos: { processed: 1, errors: 0 },
      conductores: { processed: 1, errors: 0 },
    });
    expect(summary.errors.join(' ')).toContain('RTM bloqueada');
    expect(storage.syntix_threshold).toBeUndefined();
    expect(storage.syntix_simulated_date).toBeUndefined();
    expect(storage.syntix_dark_mode).toBeUndefined();
    expect(storage.syntix_onboarding_dashboard).toBeUndefined();
    expect(storage.syntix_user).toBe('{"email":"usuario@example.com"}');
    expect(storage.syntix_token).toBe('jwt-privado');
  });
});

describe('Excel backup', () => {
  it('resume 50 registros validos por entidad para el caso masivo oficial', () => {
    const summary = summarizeBackupPayload(buildBulkExcelLikePayload());

    expect(summary).toMatchObject({
      vehiculos: 50,
      conductores: 50,
      soats: 50,
      rtms: 50,
      validCounts: {
        vehiculos: 50,
        conductores: 50,
        soats: 50,
        rtms: 50,
      },
      recordErrors: [],
      valid: true,
    });
  });

  it('construye workbook XLSX con hojas y columnas esperadas', async () => {
    const workbookBytes = buildExcelWorkbook(buildSampleBackupPayload());
    const workbookText = new TextDecoder().decode(workbookBytes);

    Object.values(EXCEL_SHEET_NAMES).forEach((sheetName) => {
      expect(workbookText).toContain(sheetName);
    });
    expect(workbookText).toContain('placa');
    expect(workbookText).toContain('conductorDocumento');
    expect(workbookText).toContain('numeroPoliza');
    expect(workbookText).toContain('fechaVencimiento');
    expect(workbookText).toContain('No se importan ni exportan alertas');

    const parsed = await parseExcelBackup(workbookBytes);
    expect(parsed.vehiculos).toHaveLength(10);
    expect(parsed.conductores).toHaveLength(10);
    expect(parsed.soats).toHaveLength(10);
    expect(parsed.rtms).toHaveLength(10);
    expect(parsed.vehiculos[0].placa).toBe('DCV101');
    expect(validateBackupPayload(parsed).valid).toBe(true);
  });

  it('parsea workbook desde ArrayBuffer y rechaza bytes que no son XLSX', async () => {
    const workbookBytes = buildExcelWorkbook(buildSampleBackupPayload());
    const arrayBuffer = workbookBytes.buffer.slice(
      workbookBytes.byteOffset,
      workbookBytes.byteOffset + workbookBytes.byteLength
    );
    const parsed = await parseExcelBackup(arrayBuffer);

    expect(parsed.vehiculos[0].placa).toBe('DCV101');
    await expect(parseExcelBackup(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow(/XLSX valida/i);
  });

  it('lee XLSX con bytes adicionales al final y rechaza libros sin workbook', async () => {
    const workbookBytes = buildExcelWorkbook(buildSampleBackupPayload());
    const withTrailingBytes = new Uint8Array(workbookBytes.length + 2);
    withTrailingBytes.set(workbookBytes);
    withTrailingBytes.set([9, 9], workbookBytes.length);

    await expect(parseExcelBackup(withTrailingBytes)).resolves.toMatchObject({
      vehiculos: expect.any(Array),
    });

    const workbookText = new TextDecoder().decode(workbookBytes);
    const mutated = new Uint8Array(workbookBytes);
    const search = 'xl/workbook.xml';
    const replacement = 'xl/workb00k.xml';
    let index = workbookText.indexOf(search);
    while (index >= 0) {
      mutated.set(new TextEncoder().encode(replacement), index);
      index = workbookText.indexOf(search, index + search.length);
    }

    await expect(parseExcelBackup(mutated)).rejects.toThrow(/libro/i);
  });

  it('genera plantilla Excel vacia con instrucciones y preferencias permitidas', async () => {
    const parsed = await parseExcelBackup(buildExcelWorkbook(buildBackupTemplatePayload()));

    expect(parsed).toMatchObject({
      vehiculos: [],
      conductores: [],
      soats: [],
      rtms: [],
      validaciones: [],
      preferences: {
        syntix_threshold: '',
        syntix_simulated_date: '',
        syntix_dark_mode: '',
      },
    });
    expect(validateBackupPayload(parsed).valid).toBe(true);
  });

  it('rechaza Excel sin hojas requeridas', async () => {
    const workbookBytes = buildExcelWorkbook(buildSampleBackupPayload());
    const workbookText = new TextDecoder().decode(workbookBytes);
    const index = workbookText.indexOf(EXCEL_SHEET_NAMES.soats);
    const mutated = new Uint8Array(workbookBytes);
    mutated.set(new TextEncoder().encode('S0AT'), index);

    await expect(parseExcelBackup(mutated)).rejects.toThrow(/SOAT/i);
  });

  it('detecta SOAT sin placa, RTM sin placa y placas inexistentes luego de parsear Excel', async () => {
    const payload = buildBackupPayload({
      vehiculos: [{ placa: 'ABC123', marca: 'Toyota', modelo: 'Hilux', anio: 2026, tipo: 'Pickup' }],
      conductores: [],
      soats: [{ placaVehiculo: '', numeroPoliza: 'SOAT-SIN-PLACA' }],
      rtms: [{ placaVehiculo: 'ZZZ999', fechaVencimiento: '2026-12-31' }],
      preferences: { syntix_threshold: '15' },
    });
    const parsed = await parseExcelBackup(buildExcelWorkbook(payload));
    const validation = validateBackupPayload(parsed);

    expect(validation.valid).toBe(false);
    expect(validation.recordErrors.map((error) => error.message).join(' ')).toMatch(/placa del SOAT es obligatoria/i);
    expect(validation.recordErrors.map((error) => error.message).join(' ')).toMatch(/ZZZ999 no existe/i);
  });

  it('no propaga secretos ni ownerEmail en Excel generado desde payload malicioso', async () => {
    const parsed = await parseExcelBackup(buildExcelWorkbook({
      version: BACKUP_VERSION,
      ownerEmail: 'otra@example.com',
      vehiculos: [{
        placa: 'ABC123',
        marca: 'Toyota',
        modelo: 'Hilux',
        anio: 2026,
        tipo: 'Pickup',
        token: 'privado',
        clientSecret: 'privado',
      }],
      conductores: [],
      soats: [],
      rtms: [],
      preferences: { syntix_threshold: '15', JWT_SECRET: 'privado' },
    }));

    expectNoSensitiveOrOwnershipFields(parsed);
    expect(parsed.preferences).toMatchObject({ syntix_threshold: '15' });
    expect(parsed.preferences).not.toHaveProperty('JWT_SECRET');
  });

  it('downloadExcelBackup descarga un Blob XLSX y revoca la URL temporal', () => {
    const link = { href: '', download: '', click: vi.fn() };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const urlMock = {
      createObjectURL: vi.fn(() => 'blob:excel'),
      revokeObjectURL: vi.fn(),
    };

    vi.stubGlobal('URL', urlMock);
    vi.stubGlobal('document', {
      createElement: vi.fn(() => link),
      body: { appendChild, removeChild },
    });

    downloadExcelBackup(buildBackupTemplatePayload(), 'plantilla.xlsx');

    expect(urlMock.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(link.download).toBe('plantilla.xlsx');
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledWith(link);
    expect(urlMock.revokeObjectURL).toHaveBeenCalledWith('blob:excel');
  });
});

describe('downloadJsonBackup', () => {
  it('crea y revoca una URL temporal para descargar el JSON', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T12:00:00.000Z'));
    const link = { href: '', download: '', click: vi.fn() };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const blobSpy = vi.fn(function BlobMock(parts, options) {
      this.parts = parts;
      this.options = options;
    });
    const urlMock = {
      createObjectURL: vi.fn(() => 'blob:backup'),
      revokeObjectURL: vi.fn(),
    };

    vi.stubGlobal('Blob', blobSpy);
    vi.stubGlobal('URL', urlMock);
    vi.stubGlobal('document', {
      createElement: vi.fn(() => link),
      body: { appendChild, removeChild },
    });

    downloadJsonBackup({ version: BACKUP_VERSION, vehiculos: [] }, 'backup.json');

    expect(blobSpy).toHaveBeenCalledWith(
      [serializeJsonBackup({ version: BACKUP_VERSION, vehiculos: [] })],
      { type: 'application/json' }
    );
    expect(urlMock.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(link).toMatchObject({
      href: 'blob:backup',
      download: 'backup.json',
    });
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledWith(link);
    expect(urlMock.revokeObjectURL).toHaveBeenCalledWith('blob:backup');
  });
});

describe('buildBackupFileName', () => {
  it('usa prefijo drive-control-backup y fecha ISO local del respaldo', () => {
    const fileName = buildBackupFileName(new Date('2026-05-22T10:00:00.000Z'));

    expect(fileName).toBe('drive-control-backup-2026-05-22.json');
  });
});
