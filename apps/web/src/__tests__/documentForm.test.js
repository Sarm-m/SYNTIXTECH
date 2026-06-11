import { describe, expect, it } from 'vitest';
import { validateRtmDocument, validateSoatDocument } from '@/utils/documentForm.js';

const validSoat = {
  numeroPoliza: 'soat-2026',
  aseguradora: ' SURA ',
  fechaExpedicion: '2026-01-01',
  fechaInicioVigencia: '2026-01-02',
  fechaFinVigencia: '2027-01-01',
  observaciones: ' vigente ',
};

const validRtm = {
  numeroCertificado: 'rtm-2026',
  cda: ' CDA Norte ',
  fechaExpedicion: '2026-01-01',
  fechaVencimiento: '2027-01-01',
  resultado: 'Aprobado',
  observaciones: ' vigente ',
};

describe('document form validation', () => {
  it('normaliza y construye un SOAT valido', () => {
    const result = validateSoatDocument({
      formData: validSoat,
      vehicleId: 'vehicle-1',
      vehiclePlate: 'abc-123',
    });

    expect(result.error).toBe('');
    expect(result.data).toMatchObject({
      vehiculoId: 'vehicle-1',
      placaVehiculo: 'ABC123',
      numeroPoliza: 'SOAT-2026',
      aseguradora: 'SURA',
      observaciones: 'vigente',
    });
  });

  it('rechaza un rango de vigencia SOAT invertido', () => {
    const result = validateSoatDocument({
      formData: { ...validSoat, fechaFinVigencia: '2025-12-31' },
      vehicleId: 'vehicle-1',
      vehiclePlate: 'ABC123',
    });

    expect(result.error).toMatch(/fecha fin de vigencia/i);
    expect(result.data).toBeNull();
  });

  it('normaliza y construye una RTM valida', () => {
    const result = validateRtmDocument({
      formData: validRtm,
      vehicleId: 'vehicle-1',
      vehiclePlate: 'abc 123',
    });

    expect(result.error).toBe('');
    expect(result.data).toMatchObject({
      placaVehiculo: 'ABC123',
      numeroCertificado: 'RTM-2026',
      cda: 'CDA Norte',
      observaciones: 'vigente',
    });
  });

  it('rechaza una RTM sin vehiculo asociado', () => {
    const result = validateRtmDocument({
      formData: validRtm,
      vehicleId: '',
      vehiclePlate: 'ABC123',
    });

    expect(result.error).toMatch(/vehiculo asociado/i);
    expect(result.data).toBeNull();
  });
});
