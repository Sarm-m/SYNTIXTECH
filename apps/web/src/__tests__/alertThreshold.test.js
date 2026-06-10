import { describe, expect, it } from 'vitest';
import { isThresholdDraft, validateAlertThreshold } from '../utils/alertThreshold.js';

describe('alertThreshold', () => {
  it('permite vacio temporal y no antepone cero durante edicion', () => {
    expect(isThresholdDraft('')).toBe(true);
    expect(isThresholdDraft('30')).toBe(true);
    expect(isThresholdDraft('30x')).toBe(false);
  });

  it('normaliza ceros iniciales al guardar', () => {
    expect(validateAlertThreshold('012')).toMatchObject({
      valid: true,
      value: 12,
      normalized: '12',
    });
  });

  it('rechaza valores vacios y fuera del rango de la app', () => {
    expect(validateAlertThreshold('')).toMatchObject({ valid: false });
    expect(validateAlertThreshold('0')).toMatchObject({ valid: false });
    expect(validateAlertThreshold('12121212')).toMatchObject({ valid: false });
    expect(validateAlertThreshold('61')).toMatchObject({ valid: false });
  });
});
