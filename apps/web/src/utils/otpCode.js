export const OTP_LENGTH = 6;

export const createEmptyOtp = (length = OTP_LENGTH) => Array.from({ length }, () => '');

export const normalizeOtpCode = (input, length = OTP_LENGTH) =>
  Array.from(String(input ?? ''))
    .filter((character) => character >= '0' && character <= '9')
    .join('')
    .slice(0, length);

export const splitOtpDigits = (input, length = OTP_LENGTH) => {
  const digits = normalizeOtpCode(input, length).split('');
  return [...digits, ...createEmptyOtp(length)].slice(0, length);
};

export const isCompleteOtp = (digits, length = OTP_LENGTH) =>
  Array.isArray(digits) &&
  digits.length === length &&
  digits.every((digit) => /^[0-9]$/.test(String(digit)));

export const getOtpCode = (digits, length = OTP_LENGTH) =>
  splitOtpDigits(Array.isArray(digits) ? digits.join('') : digits, length).join('');

export const getNextOtpFocusIndex = (digits, length = OTP_LENGTH) => {
  const nextEmptyIndex = splitOtpDigits(Array.isArray(digits) ? digits.join('') : digits, length)
    .findIndex((digit) => !digit);

  return nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
};

export const getOtpNavigationTarget = ({ key, index, digits, length = OTP_LENGTH }) => {
  if (key === 'Backspace' && !digits[index] && index > 0) return index - 1;
  if (key === 'ArrowLeft' && index > 0) return index - 1;
  if (key === 'ArrowRight' && index < length - 1) return index + 1;
  return index;
};
