import { describe, expect, it } from 'vitest';
import { buildAlertsSnapshot } from '../utils/buildAlertsSnapshot.js';
import { buildAlertSignature } from '../utils/alertSignature.js';

describe('buildAlertsSnapshot', () => {
  it('con SOAT y RTM vencidos, total coincide con suma de alertas activas', () => {
    const snapshot = buildAlertsSnapshot({
      soats: [{
        id: 1,
        placaVehiculo: 'ABC123',
        estado: 'rojo',
        diasRestantes: -10,
        fechaFinVigencia: '2026-01-01',
      }],
      rtms: [{
        id: 2,
        placaVehiculo: 'ABC123',
        estado: 'rojo',
        diasRestantes: -3,
        fechaVencimiento: '2026-02-01',
      }],
      conductores: [],
      vehiculos: [],
    });

    expect(snapshot.totalActiveAlerts).toBe(snapshot.alerts.length);
    expect(snapshot.totalActiveAlerts).toBe(2);
  });

  it('documentos vigentes no generan alertas', () => {
    const snapshot = buildAlertsSnapshot({
      soats: [{
        id: 1,
        estado: 'verde',
        diasRestantes: 30,
      }],
      rtms: [],
      conductores: [],
      vehiculos: [],
    });

    expect(snapshot.totalActiveAlerts).toBe(0);
  });

  it('usuario sin datos devuelve 0 alertas y firma estable', () => {
    const first = buildAlertsSnapshot({
      soats: [],
      rtms: [],
      conductores: [],
      vehiculos: [],
    });
    const second = buildAlertsSnapshot({
      soats: [],
      rtms: [],
      conductores: [],
      vehiculos: [],
    });

    expect(first.totalActiveAlerts).toBe(0);
    expect(second.signature).toBe(first.signature);
  });

  it('repetir el mismo input devuelve la misma firma logica', () => {
    const input = {
      soats: [{
        id: 9,
        placaVehiculo: 'SYN109',
        estado: 'amarillo',
        diasRestantes: 8,
        fechaFinVigencia: '2026-06-01',
      }],
      rtms: [],
      conductores: [],
      vehiculos: [],
    };

    const first = buildAlertsSnapshot(input);
    const second = buildAlertsSnapshot(input);

    expect(buildAlertSignature(first.alerts)).toBe(buildAlertSignature(second.alerts));
  });
});
