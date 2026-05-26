import { describe, expect, it } from 'vitest';
import { buildAlertSignature } from '../utils/alertSignature.js';

describe('buildAlertSignature', () => {
  it('ignora campos volatiles como fecha', () => {
    const first = [{
      id: 'soat-1',
      tipo: 'SOAT',
      prioridad: 'rojo',
      diasRestantes: -1,
      fecha: '2026-05-21T10:00:00.000Z',
    }];
    const second = [{
      id: 'soat-1',
      tipo: 'SOAT',
      prioridad: 'rojo',
      diasRestantes: -1,
      fecha: '2026-05-21T11:00:00.000Z',
    }];

    expect(buildAlertSignature(first)).toBe(buildAlertSignature(second));
  });
});
