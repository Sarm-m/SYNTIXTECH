import { describe, expect, it } from 'vitest';
import { buildRecommendationDetail, getRecommendedAction } from '@/components/DashboardView.jsx';

describe('getRecommendedAction', () => {
  it('prioriza alertas críticas aunque existan alertas preventivas', () => {
    const critical = { id: 'critical', prioridad: 'rojo', diasRestantes: -2 };
    const recommendation = getRecommendedAction([
      { id: 'warning', prioridad: 'amarillo', diasRestantes: 1 },
      critical,
    ]);

    expect(recommendation).toMatchObject({
      tone: 'critical',
      alert: critical,
    });
  });

  it('selecciona la alerta crítica con mayor urgencia', () => {
    const mostUrgent = { id: 'expired-first', prioridad: 'rojo', diasRestantes: -18 };
    const recommendation = getRecommendedAction([
      { id: 'expired-second', prioridad: 'rojo', diasRestantes: -4 },
      mostUrgent,
    ]);

    expect(recommendation.alert).toBe(mostUrgent);
  });

  it('selecciona el vencimiento preventivo más cercano cuando no hay alertas críticas', () => {
    const mostUrgent = { id: 'warning-first', prioridad: 'amarillo', diasRestantes: 3 };
    const recommendation = getRecommendedAction([
      { id: 'warning-second', prioridad: 'amarillo', diasRestantes: 12 },
      mostUrgent,
    ]);

    expect(recommendation).toMatchObject({
      tone: 'preventive',
      alert: mostUrgent,
    });
  });

  it('devuelve estado positivo cuando no hay alertas activas', () => {
    expect(getRecommendedAction([])).toMatchObject({
      tone: 'positive',
      alert: null,
    });
  });

  it('resume alertas críticas sin repetir el mismo mensaje', () => {
    const detail = buildRecommendationDetail([
      { grupo: 'SOAT', entidad: 'Vehiculo JSU502' },
      { grupo: 'RTM', entidad: 'Vehiculo JSU502' },
    ], 'critical');

    expect(detail).toBe('2 alertas críticas activas: SOAT y RTM pendientes para Vehículo JSU502.');
  });

  it('usa un resumen preventivo cuando hay vencimientos en varias unidades', () => {
    const detail = buildRecommendationDetail([
      { grupo: 'SOAT', entidad: 'Vehiculo ABC123' },
      { grupo: 'SOAT', entidad: 'Vehiculo XYZ987' },
    ], 'preventive');

    expect(detail).toBe('2 alertas preventivas activas: SOAT pendientes en la flota.');
  });
});
