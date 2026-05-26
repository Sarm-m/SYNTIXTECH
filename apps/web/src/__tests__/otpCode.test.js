import { describe, expect, it } from 'vitest';
import {
  OTP_LENGTH,
  createEmptyOtp,
  getNextOtpFocusIndex,
  getOtpNavigationTarget,
  getOtpCode,
  isCompleteOtp,
  normalizeOtpCode,
  splitOtpDigits,
} from '@/utils/otpCode.js';

describe('otpCode utils', () => {
  it('pegar 416997 llena las seis casillas', () => {
    expect(splitOtpDigits('416997')).toEqual(['4', '1', '6', '9', '9', '7']);
  });

  it('pegar 416 997 normaliza espacios', () => {
    expect(splitOtpDigits('416 997')).toEqual(['4', '1', '6', '9', '9', '7']);
  });

  it('pegar texto adicional extrae los 6 digitos', () => {
    expect(splitOtpDigits('Codigo: 416997')).toEqual(['4', '1', '6', '9', '9', '7']);
    expect(splitOtpDigits('Tu codigo es 416997')).toEqual(['4', '1', '6', '9', '9', '7']);
  });

  it('normaliza guiones y conserva ceros iniciales', () => {
    expect(normalizeOtpCode('012-345')).toBe('012345');
    expect(splitOtpDigits('012345')).toEqual(['0', '1', '2', '3', '4', '5']);
  });

  it('toma maximo seis digitos', () => {
    expect(normalizeOtpCode('123456789')).toBe('123456');
  });

  it('detecta codigo completo e incompleto', () => {
    expect(isCompleteOtp(['4', '1', '6', '9', '9', '7'])).toBe(true);
    expect(isCompleteOtp(['4', '1', '', '9', '9', '7'])).toBe(false);
  });

  it('compone el codigo completo desde casillas', () => {
    expect(getOtpCode(['0', '1', '2', '3', '4', '5'])).toBe('012345');
  });

  it('calcula el siguiente foco despues de escribir o pegar', () => {
    expect(getNextOtpFocusIndex(['4', '', '', '', '', ''])).toBe(1);
    expect(getNextOtpFocusIndex(['4', '1', '6', '9', '9', '7'])).toBe(OTP_LENGTH - 1);
  });

  it('modela navegacion con Backspace y flechas', () => {
    expect(getOtpNavigationTarget({
      key: 'Backspace',
      index: 2,
      digits: ['4', '1', '', '', '', ''],
    })).toBe(1);
    expect(getOtpNavigationTarget({
      key: 'ArrowLeft',
      index: 3,
      digits: ['4', '1', '6', '', '', ''],
    })).toBe(2);
    expect(getOtpNavigationTarget({
      key: 'ArrowRight',
      index: 3,
      digits: ['4', '1', '6', '', '', ''],
    })).toBe(4);
  });

  it('crea estado vacio para limpiar reenvios', () => {
    expect(createEmptyOtp()).toEqual(['', '', '', '', '', '']);
    expect(getNextOtpFocusIndex(createEmptyOtp())).toBe(0);
  });
    it('mantiene el foco actual cuando la tecla no requiere navegacion', () => {
    expect(getOtpNavigationTarget({
      key: 'Enter',
      index: 2,
      digits: ['4', '1', '6', '', '', ''],
    })).toBe(2);

    expect(getOtpNavigationTarget({
      key: 'Backspace',
      index: 0,
      digits: ['', '', '', '', '', ''],
    })).toBe(0);

    expect(getOtpNavigationTarget({
      key: 'ArrowLeft',
      index: 0,
      digits: ['4', '', '', '', '', ''],
    })).toBe(0);

    expect(getOtpNavigationTarget({
      key: 'ArrowRight',
      index: 5,
      digits: ['4', '1', '6', '9', '9', '7'],
    })).toBe(5);
  });
});

