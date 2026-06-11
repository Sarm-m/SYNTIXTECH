import { describe, expect, it } from 'vitest';
import { buildDemoCsv, buildDemoData } from '@/utils/demoData.js';

const REFERENCE_DATE = '2026-06-10';

describe('buildDemoData', () => {
  it('genera una demo aislada, de solo lectura y con datos operativos útiles', () => {
    const demo = buildDemoData(REFERENCE_DATE);

    expect(demo).toMatchObject({
      referenceDate: REFERENCE_DATE,
      readOnly: true,
    });
    expect(demo.vehiculos).toHaveLength(10);
    expect(demo.conductores).toHaveLength(10);
    expect(demo.soats).toHaveLength(9);
    expect(demo.rtms).toHaveLength(9);
    expect(demo.alerts.length).toBeGreaterThan(0);
    expect(demo.qualityMetrics).toHaveLength(3);
    expect(demo.soats[0].vehiculoId).toBe(demo.vehiculos[0].id);
    expect(demo.vehiculos[0]).toMatchObject({
      placa: 'DCV101',
      conductorId: 'demo-driver-1',
      conductor: { documento: '1000000001' },
      soat: { numeroPoliza: 'SOAT-DCV101-2026' },
      rtm: { numeroCertificado: 'RTM-DCV101' },
    });
  });

  it('reajusta fechas y conserva estados vigentes, próximos y vencidos', () => {
    const demo = buildDemoData(REFERENCE_DATE);
    const states = new Set([
      ...demo.conductores,
      ...demo.soats,
      ...demo.rtms,
    ].map((item) => item.estado));

    expect(states).toEqual(new Set(['rojo', 'amarillo', 'verde']));
    expect(demo.soats[0]).toMatchObject({
      fechaFinVigencia: '2026-04-29',
      diasRestantes: -42,
      estado: 'rojo',
    });
    expect(demo.soats[3]).toMatchObject({
      fechaFinVigencia: '2026-06-15',
      diasRestantes: 5,
      estado: 'amarillo',
    });
  });

  it('prioriza alertas críticas y no incluye credenciales ni ownership de backend', () => {
    const demo = buildDemoData(REFERENCE_DATE);
    const firstPreventiveIndex = demo.alerts.findIndex((alert) => alert.prioridad === 'amarillo');
    const lastCriticalIndex = demo.alerts.findLastIndex((alert) => alert.prioridad === 'rojo');
    const serialized = JSON.stringify(demo);

    expect(firstPreventiveIndex).toBeGreaterThan(-1);
    expect(lastCriticalIndex).toBeLessThan(firstPreventiveIndex);
    expect(serialized).not.toMatch(/ownerEmail|password|accessToken|refreshToken|jwt|secret/i);
  });

  it('construye un CSV descargable a partir de la vista demo', () => {
    const demo = buildDemoData(REFERENCE_DATE);
    const csv = buildDemoCsv(demo);

    expect(csv.split('\n')).toHaveLength(demo.vehiculos.length + 1);
    expect(csv).toContain('"Placa","Marca","Modelo"');
    expect(csv).toContain(`"${demo.vehiculos[0].placa}"`);
    expect(csv).not.toMatch(/ownerEmail|password|token/i);
  });
});
