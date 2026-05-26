import { describe, expect, it } from 'vitest';
import {
  calculateDaysRemaining,
  calculateDocumentState,
  formatColombianDate,
  getDocumentStatus,
  getDocumentStatusReason,
  getExpirationAlertText,
  getRelativeExpirationText,
  getStatusLabel,
  getVehicleStatusSummary,
  getWorstState,
} from '../utils/dateUtils.js';

describe('dateUtils - validacion de fechas y estados documentales', () => {
  it('CP-SRM-01 calcula los dias restantes para una fecha futura valida', () => {
    const result = calculateDaysRemaining('2026-05-10', '2026-05-01');

    expect(result).toBe(9);
  });

  it('CP-SRM-02 retorna estado rojo cuando la fecha del documento esta vacia', () => {
    const daysRemaining = calculateDaysRemaining('', '2026-05-01');
    const state = calculateDocumentState(daysRemaining);

    expect(daysRemaining).toBe(-999);
    expect(state).toBe('rojo');
  });

  it('CP-SRM-03 retorna estado rojo cuando la fecha del documento es invalida', () => {
    const daysRemaining = calculateDaysRemaining('fecha-invalida', '2026-05-01');
    const state = calculateDocumentState(daysRemaining);

    expect(daysRemaining).toBe(-999);
    expect(state).toBe('rojo');
  });

  it('CP-SRM-04 clasifica como rojo un documento que vence exactamente hoy', () => {
    const daysRemaining = calculateDaysRemaining('2026-05-01', '2026-05-01');
    const state = calculateDocumentState(daysRemaining);

    expect(daysRemaining).toBe(0);
    expect(state).toBe('rojo');
  });

  it('CP-SRM-05 clasifica como amarillo un documento en el limite de alerta', () => {
    const daysRemaining = calculateDaysRemaining('2026-05-16', '2026-05-01');
    const state = calculateDocumentState(daysRemaining, 15);

    expect(daysRemaining).toBe(15);
    expect(state).toBe('amarillo');
  });

  it('CP-SRM-06 obtiene el peor estado documental entre dos documentos', () => {
    const result = getWorstState('verde', 'rojo');

    expect(result).toBe('rojo');
  });

  it('CP-SRM-07 obtiene el peor estado cuando el segundo estado es mas critico', () => {
    const result = getWorstState('verde', 'amarillo');

    expect(result).toBe('amarillo');
  });

  it('CP-SRM-08 formatea fechas en formato colombiano', () => {
    expect(formatColombianDate('2026-05-17')).toBe('17/05/2026');
  });

  it('CP-SRM-09 describe vencimientos vencidos sin mostrar dias negativos', () => {
    const result = getExpirationAlertText(-29, '2026-04-12');

    expect(result.fullText).toBe('Vencido hace 29 d\u00edas \u00b7 Venci\u00f3 el 12/04/2026');
  });

  it('CP-SRM-10 describe vencimientos proximos con fecha exacta', () => {
    const result = getExpirationAlertText(6, '2026-05-17');

    expect(result.fullText).toBe('Faltan 6 d\u00edas \u00b7 Vence el 17/05/2026');
  });

  it('CP-SRM-11 describe vencimientos del dia actual', () => {
    const result = getExpirationAlertText(0, '2026-05-11');

    expect(result.fullText).toBe('Vence hoy \u00b7 11/05/2026');
  });

  it('CP-SRM-12 calcula correctamente 158 dias vencidos con fecha simulada', () => {
    const result = calculateDaysRemaining('2025-12-15', '2026-05-22');

    expect(result).toBe(-158);
  });

  it('CP-SRM-13 calcula correctamente 81 dias vencidos', () => {
    const result = calculateDaysRemaining('2026-03-02', '2026-05-22');

    expect(result).toBe(-81);
  });

  it('CP-SRM-14 calcula correctamente 12 dias vencidos', () => {
    const result = calculateDaysRemaining('2026-05-10', '2026-05-22');

    expect(result).toBe(-12);
  });

  it('CP-SRM-15 vencido hace 158 dias es estado rojo', () => {
    const daysRemaining = -158;
    const state = calculateDocumentState(daysRemaining);

    expect(state).toBe('rojo');
  });

  it('CP-SRM-16 con fecha simulada 2026-05-22 el documento vence hoy sin desfase horario', () => {
    const daysRemaining = calculateDaysRemaining('2026-05-22', '2026-05-22');
    const state = calculateDocumentState(daysRemaining);

    expect(daysRemaining).toBe(0);
    expect(state).toBe('rojo');
  });

  it('CP-SRM-17 calcula 10 dias por vencer con fecha simulada', () => {
    const daysRemaining = calculateDaysRemaining('2026-06-01', '2026-05-22');
    const state = calculateDocumentState(daysRemaining, 15);

    expect(daysRemaining).toBe(10);
    expect(state).toBe('amarillo');
  });

  it('CP-SRM-18 normaliza labels visibles de estado', () => {
    expect(getStatusLabel('rojo')).toBe('Cr\u00edtico');
    expect(getStatusLabel('amarillo')).toBe('Por vencer');
    expect(getStatusLabel('verde')).toBe('Al d\u00eda');
  });

  it('CP-SRM-19 construye texto relativo singular y plural', () => {
    expect(getRelativeExpirationText(1)).toBe('Falta 1 d\u00eda');
    expect(getRelativeExpirationText(2)).toBe('Faltan 2 d\u00edas');
    expect(getRelativeExpirationText(-1)).toBe('Vencido hace 1 d\u00eda');
    expect(getRelativeExpirationText(-2)).toBe('Vencido hace 2 d\u00edas');
  });

  it('CP-SRM-20 devuelve estado documental critico para vencimiento de hoy', () => {
    const result = getDocumentStatus({
      expirationDate: '2026-05-22',
      referenceDate: '2026-05-22',
      documentLabel: 'SOAT',
    });

    expect(result).toMatchObject({
      status: 'rojo',
      label: 'Cr\u00edtico',
      daysRemaining: 0,
      relativeText: 'Vence hoy',
      reason: 'SOAT vence hoy',
    });
  });

  it('CP-SRM-21 devuelve estado por vencer y al dia con el mismo umbral', () => {
    const warning = getDocumentStatus({
      expirationDate: '2026-06-01',
      referenceDate: '2026-05-22',
      warningThresholdDays: 15,
      documentLabel: 'RTM',
    });
    const ok = getDocumentStatus({
      expirationDate: '2026-07-15',
      referenceDate: '2026-05-22',
      warningThresholdDays: 15,
      documentLabel: 'RTM',
    });

    expect(warning).toMatchObject({
      status: 'amarillo',
      label: 'Por vencer',
      reason: 'RTM vence en 10 d\u00edas',
    });
    expect(ok).toMatchObject({
      status: 'verde',
      label: 'Al d\u00eda',
      reason: 'RTM vigente',
    });
  });

  it('CP-SRM-22 construye razones documentales cortas', () => {
    expect(getDocumentStatusReason({ documentLabel: 'Licencia', daysRemaining: -12 })).toBe(
      'Licencia vencida hace 12 d\u00edas'
    );
    expect(getDocumentStatusReason({ documentLabel: 'Licencia', daysRemaining: 6 })).toBe(
      'Licencia vence en 6 d\u00edas'
    );
    expect(getDocumentStatusReason({ documentLabel: 'Licencia', daysRemaining: 45 })).toBe(
      'Licencia vigente'
    );
    expect(getDocumentStatusReason({ documentLabel: 'Licencia', daysRemaining: -999 })).toBe(
      'Licencia sin fecha'
    );
  });

  it('CP-SRM-23 resume vehiculo critico por SOAT vencido', () => {
    const result = getVehicleStatusSummary({
      conductorId: 'cond-1',
      soat: { estado: 'rojo', diasRestantes: -40 },
      rtm: { estado: 'verde', diasRestantes: 80 },
      conductor: { estado: 'verde', diasRestantes: 90 },
    });

    expect(result).toEqual({
      status: 'rojo',
      label: 'Cr\u00edtico',
      reason: 'SOAT vencido hace 40 d\u00edas',
      reasons: ['SOAT vencido hace 40 d\u00edas'],
    });
  });

  it('CP-SRM-24 resume vehiculo por vencer por RTM cercana', () => {
    const result = getVehicleStatusSummary({
      conductorId: 'cond-1',
      soat: { estado: 'verde', diasRestantes: 80 },
      rtm: { estado: 'amarillo', diasRestantes: 6 },
      conductor: { estado: 'verde', diasRestantes: 90 },
    });

    expect(result).toEqual({
      status: 'amarillo',
      label: 'Por vencer',
      reason: 'RTM vence en 6 d\u00edas',
      reasons: ['RTM vence en 6 d\u00edas'],
    });
  });

  it('CP-SRM-25 resume vehiculo sin problemas como al dia', () => {
    const result = getVehicleStatusSummary({
      conductorId: 'cond-1',
      soat: { estado: 'verde', diasRestantes: 80 },
      rtm: { estado: 'verde', diasRestantes: 70 },
      conductor: { estado: 'verde', diasRestantes: 90 },
    });

    expect(result).toEqual({
      status: 'verde',
      label: 'Al d\u00eda',
      reason: 'Documentos vigentes',
      reasons: ['Documentos vigentes'],
    });
  });

  it('CP-SRM-26 prioriza brechas estructurales del vehiculo', () => {
    const result = getVehicleStatusSummary({
      soat: { estado: 'verde', diasRestantes: 80 },
      rtm: { estado: 'verde', diasRestantes: 70 },
    });

    expect(result).toEqual({
      status: 'rojo',
      label: 'Cr\u00edtico',
      reason: 'Sin conductor asignado',
      reasons: ['Sin conductor asignado'],
    });
  });

  it('CP-SRM-27 resume vehiculo critico con SOAT y RTM vencidos sin perder razones', () => {
    const result = getVehicleStatusSummary({
      conductorId: 'cond-1',
      soat: { estado: 'rojo', diasRestantes: -40 },
      rtm: { estado: 'rojo', diasRestantes: -158 },
      conductor: { estado: 'verde', diasRestantes: 90 },
    });

    expect(result).toEqual({
      status: 'rojo',
      label: 'Cr\u00edtico',
      reason: 'SOAT vencido hace 40 d\u00edas',
      reasons: ['SOAT vencido hace 40 d\u00edas', 'RTM vencida hace 158 d\u00edas'],
    });
  });

  it('CP-SRM-28 resume vehiculo con SOAT vencido y sin conductor asignado', () => {
    const result = getVehicleStatusSummary({
      soat: { estado: 'rojo', diasRestantes: -40 },
      rtm: { estado: 'verde', diasRestantes: 90 },
    });

    expect(result).toEqual({
      status: 'rojo',
      label: 'Cr\u00edtico',
      reason: 'SOAT vencido hace 40 d\u00edas',
      reasons: ['SOAT vencido hace 40 d\u00edas', 'Sin conductor asignado'],
    });
  });

  it('CP-SRM-29 resume vehiculo por vencer con SOAT y RTM proximos', () => {
    const result = getVehicleStatusSummary({
      conductorId: 'cond-1',
      soat: { estado: 'amarillo', diasRestantes: 10 },
      rtm: { estado: 'amarillo', diasRestantes: 6 },
      conductor: { estado: 'verde', diasRestantes: 90 },
    });

    expect(result).toEqual({
      status: 'amarillo',
      label: 'Por vencer',
      reason: 'SOAT vence en 10 d\u00edas',
      reasons: ['SOAT vence en 10 d\u00edas', 'RTM vence en 6 d\u00edas'],
    });
  });

  it('CP-SRM-30 resume vehiculo con RTM y licencia vencidas', () => {
    const result = getVehicleStatusSummary({
      conductorId: 'cond-1',
      soat: { estado: 'verde', diasRestantes: 90 },
      rtm: { estado: 'rojo', diasRestantes: -158 },
      conductor: { estado: 'rojo', diasRestantes: -12 },
    });

    expect(result).toEqual({
      status: 'rojo',
      label: 'Cr\u00edtico',
      reason: 'RTM vencida hace 158 d\u00edas',
      reasons: ['RTM vencida hace 158 d\u00edas', 'Licencia vencida hace 12 d\u00edas'],
    });
  });

  it('CP-SRM-31 mantiene razones unicas y labels funcionales en vehiculos', () => {
    const result = getVehicleStatusSummary({
      conductorId: 'cond-1',
      soat: { estado: 'rojo', diasRestantes: -40 },
      rtm: { estado: 'rojo', diasRestantes: -40 },
      conductor: { estado: 'verde', diasRestantes: 90 },
    });

    expect(new Set(result.reasons).size).toBe(result.reasons.length);
    expect(['ROJO', 'AMARILLO', 'VERDE']).not.toContain(result.label);
    expect(result.label).toBe('Cr\u00edtico');
  });
});
