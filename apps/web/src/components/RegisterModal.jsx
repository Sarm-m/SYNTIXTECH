import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Mail, Lock, Building, Phone, Loader2, ShieldCheck, RefreshCw, Eye, EyeOff, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { queueOnboardingForUser } from '@/contexts/OnboardingContext.jsx';
import { authService } from '@/services/api.js';
import GoogleAuthButton from '@/components/GoogleAuthButton.jsx';
import { isValidColombianMobile } from '@/utils/colombiaFormats.js';
import { isValidEmailFormat } from '@/utils/emailValidation.js';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock.js';
import {
  OTP_LENGTH,
  createEmptyOtp,
  getOtpNavigationTarget,
  getNextOtpFocusIndex,
  getOtpCode,
  isCompleteOtp,
  normalizeOtpCode,
  splitOtpDigits,
} from '@/utils/otpCode.js';

const isOnlyDigits = (value) =>
  Array.from(String(value ?? '')).every((character) => character >= '0' && character <= '9');

// Registro en dos pasos: alta inicial y luego verificación OTP para cerrar el onboarding.
export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  // `formData` concentra el paso inicial del registro tradicional.
  const [formData, setFormData] = useState({ email: '', password: '', empresa: '', telefono: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // `step` define si estamos rellenando datos, eligiendo canal de OTP, o confirmando el OTP.
  const [step, setStep] = useState('register'); // 'register' | 'chooseChannel' | 'verify'
  // `pendingEmail` conserva el correo que debe verificarse en el segundo paso.
  const [pendingEmail, setPendingEmail] = useState('');
  // `pendingTelefono` conserva el teléfono para poder enviar OTP por SMS si el usuario lo elige.
  const [pendingTelefono, setPendingTelefono] = useState('');
  // `otpChannel` guarda el canal elegido por el usuario ('email' | 'sms').
  const [otpChannel, setOtpChannel] = useState('email');
  // El OTP se separa en 6 casillas para mejorar legibilidad y foco.
  const [otp, setOtp] = useState(createEmptyOtp());
  // Cooldown visual para limitar reenvíos desde el cliente.
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);
  const cooldownIntervalRef = useRef(null);
  const webOtpAbortRef = useRef(null);
  const { register, loginAfterVerification, loginWithGoogle } = useAuth();
  useBodyScrollLock(isOpen);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
  }, []);

  const abortWebOtpWait = useCallback(() => {
    if (webOtpAbortRef.current) {
      webOtpAbortRef.current.abort();
      webOtpAbortRef.current = null;
    }
  }, []);

  const focusOtpInput = useCallback((index = 0) => {
    const safeIndex = Math.min(Math.max(index, 0), OTP_LENGTH - 1);
    setTimeout(() => inputRefs.current[safeIndex]?.focus(), 0);
  }, []);

  const applyOtpValue = useCallback((value) => {
    const nextOtp = splitOtpDigits(value);
    setOtp(nextOtp);
    focusOtpInput(getNextOtpFocusIndex(nextOtp));
    return nextOtp;
  }, [focusOtpInput]);

  const resetOtpAndFocus = useCallback(() => {
    setOtp(createEmptyOtp());
    focusOtpInput(0);
  }, [focusOtpInput]);

  const startWebOtpWait = useCallback(() => {
    if (
      typeof window === 'undefined' ||
      !('OTPCredential' in window) ||
      !navigator.credentials
    ) {
      return;
    }

    abortWebOtpWait();
    const abortController = new AbortController();
    webOtpAbortRef.current = abortController;

    navigator.credentials
      .get({
        otp: { transport: ['sms'] },
        signal: abortController.signal,
      })
      .then((otpCredential) => {
        if (!abortController.signal.aborted && otpCredential?.code) {
          applyOtpValue(otpCredential.code);
        }
      })
      .catch(() => {
        // WebOTP es progresivo: navegadores no compatibles o abortos no deben mostrarse al usuario.
      })
      .finally(() => {
        if (webOtpAbortRef.current === abortController) {
          webOtpAbortRef.current = null;
        }
      });
  }, [abortWebOtpWait, applyOtpValue]);

  const handleClose = useCallback(() => {
    abortWebOtpWait();
    clearCooldownTimer();
    setPendingGoogleToken('');
    onClose();
  }, [abortWebOtpWait, clearCooldownTimer, onClose]);

  useEffect(() => {
    if (!isOpen || step !== 'verify' || otpChannel !== 'sms') {
      abortWebOtpWait();
      return undefined;
    }

    startWebOtpWait();
    return abortWebOtpWait;
  }, [abortWebOtpWait, isOpen, otpChannel, startWebOtpWait, step]);

  useEffect(() => () => {
    abortWebOtpWait();
    clearCooldownTimer();
  }, [abortWebOtpWait, clearCooldownTimer]);

  // Si el modal está cerrado, no se renderiza ni mantiene listeners visuales.
  if (!isOpen) return null;

  // Paso 1: registro base. Si el backend responde OK, se avanza al paso OTP.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const empresa = formData.empresa.trim();
    const telefono = formData.telefono.trim();
    const email = formData.email.trim().toLowerCase();

    // La empresa es requisito del modelo de negocio.
    if (!empresa) {
      setError('Ingresa el nombre de la empresa.');
      return;
    }
    // El teléfono alimenta recuperación y perfil del usuario.
    if (!telefono) {
      setError('Ingresa el teléfono.');
      return;
    }
    if (!isValidColombianMobile(telefono)) {
      setError('El celular debe tener 10 digitos e iniciar por 3.');
      return;
    }
    // El correo es la llave principal de identidad y del OTP.
    if (!isValidEmailFormat(email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!formData.password) {
      setError('Ingresa una contraseña.');
      return;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    // Se inicia la llamada al contexto solo después de pasar todas las validaciones locales.
    setIsSubmitting(true);
    try {
      // Primero se registra el usuario sin disparar OTP todavía; el canal se elige a continuación.
      const res = await register(email, formData.password, empresa, telefono);
      if (res.needsVerification) {
        // El backend creó la cuenta pendiente; ahora el usuario elige por dónde recibir el código.
        setPendingEmail(res.email || email);
        setPendingTelefono(telefono);
        setStep('chooseChannel');
      } else if (res.success) {
        // Fallback reservado para registros que no requieran OTP en otros escenarios.
        queueOnboardingForUser(res.user?.email || email);
        handleClose();
      } else {
        setError(res.message || 'Error al registrar usuario');
      }
    } catch (err) {
      setError('Error inesperado al registrar. Intente nuevamente.');
      console.error('Error registrando usuario:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async (credential) => {
    if (!credential) {
      setError('Google no devolvio un token valido.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // El backend consulta primero el correo y decide si inicia sesión o requiere completar registro.
      const res = await loginWithGoogle({
        idToken: credential,
        empresa: formData.empresa.trim(),
        telefono: formData.telefono.trim(),
      });
      if (res.success) {
        if (res.created && res.user?.email) {
          queueOnboardingForUser(res.user.email);
        }
        handleClose();
      } else if (res.mode === 'register' && (res.requiresCompanyName || res.requiresPhone)) {
        setPendingGoogleToken(credential);
        setError('Esta cuenta de Google es nueva. Completa empresa y teléfono para crearla.');
      } else {
        setError(res.message || 'No se pudo completar el registro con Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleComplete = async () => {
    const empresa = formData.empresa.trim();
    const telefono = formData.telefono.trim();

    if (!empresa) {
      setError('Ingresa el nombre de la empresa para completar el registro con Google.');
      return;
    }
    if (!telefono) {
      setError('Ingresa el teléfono para completar el registro con Google.');
      return;
    }
    if (!isValidColombianMobile(telefono)) {
      setError('El celular debe tener 10 digitos e iniciar por 3.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle({
        idToken: pendingGoogleToken,
        empresa,
        telefono,
      });
      if (res.success) {
        if (res.created && res.user?.email) {
          queueOnboardingForUser(res.user.email);
        }
        handleClose();
      } else {
        setError(res.message || 'No se pudo completar el registro con Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cooldown visual para evitar spam de reenvios.
  const startCooldown = () => {
    // Arranca en 60 y baja cada segundo hasta liberar el botón.
    clearCooldownTimer();
    setResendCooldown(60);
    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearCooldownTimer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // El usuario eligió el canal; se solicita el OTP y se avanza a la pantalla de verificación.
  const handleChannelSelect = async (channel) => {
    setError('');
    setNotice('');
    setOtpChannel(channel);
    setIsSubmitting(true);
    try {
      // Siempre se identifica la cuenta por correo; el canal le dice al backend si envía email o SMS.
      const res = await authService.reenviarCodigo(pendingEmail, channel);
      if (res.success) {
        resetOtpAndFocus();
        setNotice(res.data?.message || 'Codigo enviado.');
        setStep('verify');
        focusOtpInput(0);
        startCooldown();
      } else {
        setError(res.message || 'No se pudo enviar el codigo. Intenta de nuevo.');
      }
    } catch (err) {
      setError('Error al enviar el codigo.');
      console.error('Error enviando OTP de registro:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permite solo digitos y avanza automaticamente entre inputs.
  const handleOtpChange = (index, value) => {
    // Se rechaza cualquier carácter que no sea numérico.
    const normalizedValue = normalizeOtpCode(value);

    if (normalizedValue.length > 1) {
      applyOtpValue(normalizedValue);
      return;
    }

    if (value && !isOnlyDigits(value)) return;
    const newOtp = [...otp];
    // Cada input guarda solo el último dígito ingresado.
    newOtp[index] = normalizedValue;
    setOtp(newOtp);
    // Si el usuario escribió algo, el foco salta al siguiente cuadro.
    if (normalizedValue && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  // Si el campo esta vacio y se borra, vuelve al input anterior.
  const handleOtpKeyDown = (index, e) => {
    const targetIndex = getOtpNavigationTarget({ key: e.key, index, digits: otp });
    if (targetIndex !== index) {
      e.preventDefault();
      inputRefs.current[targetIndex]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    applyOtpValue(e.clipboardData?.getData('text') || '');
  };

  // Paso 2: valida OTP y activa sesion del usuario verificado.
  const handleVerify = async (e) => {
    e.preventDefault();
    // Se recompone el OTP completo antes de enviarlo al backend.
    const codigo = getOtpCode(otp);
    if (!isCompleteOtp(otp)) { setError('Ingresa el código completo de 6 dígitos'); return; }
    abortWebOtpWait();
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      // El backend verifica hash, expiración e intentos restantes.
      const res = await authService.verificarCodigo(pendingEmail, codigo);
      if (res.success) {
        queueOnboardingForUser(res.data.user?.email || pendingEmail);
        // Esta llamada crea la sesión real justo después de validar el OTP.
        if (loginAfterVerification) loginAfterVerification(res.data.user, res.data.token);
        handleClose();
      } else {
        setError(res.message || 'Código incorrecto');
      }
    } catch (err) {
      setError('Error al verificar. Intente nuevamente.');
      console.error('Error verificando codigo de registro:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Solicita un OTP nuevo respetando el cooldown configurado.
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    abortWebOtpWait();
    resetOtpAndFocus();
    setError('');
    setNotice('');
    setIsResending(true);
    try {
      // Siempre se identifica la cuenta por correo; el canal determina cómo llega el código.
      const res = await authService.reenviarCodigo(pendingEmail, otpChannel);
      if (res.success) {
        resetOtpAndFocus();
        setNotice(res.data?.message || 'Codigo reenviado.');
        startCooldown();
        if (otpChannel === 'sms') startWebOtpWait();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Error al reenviar el código.');
      console.error('Error reenviando codigo de registro:', err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="auth-modal-viewport safe-area-px safe-area-py fixed inset-0 z-[90] box-border flex items-start justify-center overflow-hidden bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={handleClose}
      role="presentation"
    >
      <div
        data-scroll-lock-allow="true"
        className="ios-touch-scroll auth-modal-scroll max-h-full w-full max-w-md overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
      >

        {step === 'register' && (
          <>
            <div className="sticky top-0 z-10 flex justify-between items-center border-b border-gray-100 bg-white p-5 sm:p-6">
              <h2 id="register-modal-title" className="text-2xl font-bold text-syntix-navy">Crear Cuenta</h2>
              <button
                type="button"
                onClick={handleClose}
                className="btn-icon -mr-2"
                aria-label="Cerrar registro"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5 sm:p-6">
              {error && <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">{error}</div>}
              {notice && <div className="p-3 bg-green-50 text-syntix-green text-sm rounded-lg border border-green-100">{notice}</div>}
              <div>
                <label htmlFor="register-company" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Empresa</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input id="register-company" type="text" required value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} className="field-control pl-10" placeholder="Mi Empresa SAS" />
                </div>
              </div>
              <div>
                <label htmlFor="register-phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input id="register-phone" type="tel" required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="field-control pl-10" placeholder="3001234567" />
                </div>
              </div>
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input id="register-email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="field-control pl-10" placeholder="admin@empresa.com" />
                </div>
              </div>
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input id="register-password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="field-control pl-10 pr-12" placeholder="••••••••" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary mt-6 w-full">
                {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Registrando...</>) : 'Registrarse'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">o registrarte con</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <GoogleAuthButton
                  // El botón usa el mismo proveedor global configurado en main.jsx.
                  onSuccess={handleGoogleRegister}
                  onError={(message) => setError(message || 'No se pudo completar el registro con Google.')}
                  disabled={isSubmitting}
                  text="signup_with"
                />
                {pendingGoogleToken && (
                  <button
                    type="button"
                    onClick={handleGoogleComplete}
                    disabled={isSubmitting}
                    className="btn-primary w-full"
                  >
                    {isSubmitting ? 'Completando registro...' : 'Completar registro con Google'}
                  </button>
                )}
                <p className="text-center text-xs text-gray-500">
                  Si tu cuenta ya existe, entrarás directamente. Para una cuenta nueva pediremos empresa y teléfono.
                </p>
              </div>

              <p className="text-center text-sm text-gray-600 mt-4">
                ¿Ya tienes cuenta? <button type="button" onClick={onSwitchToLogin} className="text-syntix-navy font-semibold hover:underline">Inicia Sesión</button>
              </p>
            </form>
          </>
        )}

        {step === 'chooseChannel' && (
          <>
            <div className="sticky top-0 z-10 flex justify-between items-center border-b border-gray-100 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h2 id="register-modal-title" className="text-2xl font-bold text-syntix-navy">Verificar Cuenta</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="btn-icon -mr-2"
                aria-label="Cerrar verificacion"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              {error && <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">{error}</div>}
              {notice && <div className="p-3 bg-green-50 text-syntix-green text-sm rounded-lg border border-green-100">{notice}</div>}

              <p className="text-sm text-gray-600 text-center">
                ¿Por donde quieres recibir tu codigo de verificacion?
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Opcion correo electronico */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleChannelSelect('email')}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-syntix-blue hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-12 h-12 rounded-full bg-syntix-navy/10 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 text-syntix-navy animate-spin" />
                    ) : (
                      <Mail className="w-6 h-6 text-syntix-navy group-hover:text-blue-700 transition-colors" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">Correo</p>
                    <p className="mt-0.5 max-w-full break-all text-xs text-gray-500 sm:max-w-[100px] sm:truncate">{pendingEmail}</p>
                  </div>
                </button>

                {/* Opcion SMS */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleChannelSelect('sms')}
                  className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-syntix-blue hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-12 h-12 rounded-full bg-syntix-navy/10 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 text-syntix-navy animate-spin" />
                    ) : (
                      <Smartphone className="w-6 h-6 text-syntix-navy group-hover:text-blue-700 transition-colors" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">SMS</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pendingTelefono}</p>
                  </div>
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                El codigo expira en 10 minutos.
              </p>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="sticky top-0 z-10 flex justify-between items-center border-b border-gray-100 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h2 id="register-modal-title" className="text-2xl font-bold text-syntix-navy">Verificar Cuenta</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="btn-icon -mr-2"
                aria-label="Cerrar verificacion"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleVerify} className="space-y-6 p-5 sm:p-6">
              <div className="text-center">
                {otpChannel === 'sms' ? (
                  <>
                    <p className="text-gray-600 text-sm">Enviamos un codigo de 6 digitos por SMS a</p>
                    <p className="font-semibold text-syntix-navy mt-1">{pendingTelefono}</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm">Enviamos un código de 6 dígitos a</p>
                    <p className="font-semibold text-syntix-navy mt-1">{pendingEmail}</p>
                    {/* Se avisa spam porque varios profesores/equipos suelen probar con Gmail. */}
                    <p className="text-gray-500 text-xs mt-2">Revisa tu bandeja de entrada y carpeta de spam.</p>
                  </>
                )}
              </div>

              {error && <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">{error}</div>}

              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    aria-label={`Digito ${index + 1} del codigo de verificacion`}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="h-12 min-w-0 rounded-lg border-2 border-gray-300 text-center text-lg font-bold text-syntix-navy outline-none focus:border-syntix-blue focus:ring-2 focus:ring-syntix-blue sm:h-14 sm:text-2xl"
                  />
                ))}
              </div>

              <button type="submit" disabled={isSubmitting || !isCompleteOtp(otp)} className="btn-primary w-full">
                {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Verificando...</>) : 'Verificar y Activar Cuenta'}
              </button>

              <div className="text-center">
                <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || isResending} className="flex items-center gap-1 mx-auto text-sm text-syntix-navy hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                  <RefreshCw className="w-4 h-4" />
                  {isResending ? 'Reenviando codigo...' : resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}

RegisterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSwitchToLogin: PropTypes.func.isRequired,
};
