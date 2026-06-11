import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { authService } from '@/services/api.js';
import GoogleAuthButton from '@/components/GoogleAuthButton.jsx';
import { isValidEmailFormat } from '@/utils/emailValidation.js';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock.js';

const getDigitsOnly = (value) =>
  Array.from(String(value ?? ''))
    .filter((character) => character >= '0' && character <= '9')
    .join('');

const isValidRecoveryIdentifier = (value) => {
  // Se acepta correo o un teléfono con longitud suficiente para cubrir recuperación por SMS.
  const normalizedValue = String(value || '').trim();
  return isValidEmailFormat(normalizedValue) || getDigitsOnly(normalizedValue).length >= 7;
};

// Modal ligero para autenticación desde la landing sin abandonar el flujo público.
export default function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  // `mode` controla las pantallas internas del modal: login, recover, chooseChannel, reset, googleComplete.
  const [mode, setMode] = useState('login');
  // Credenciales del acceso tradicional.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Datos para completar registro con Google cuando la cuenta es nueva.
  const [pendingGoogleToken, setPendingGoogleToken] = useState('');
  const [googleEmpresa, setGoogleEmpresa] = useState('');
  const [googleTelefono, setGoogleTelefono] = useState('');
  // Datos de recuperación de cuenta.
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // `recoveryToken` amarra el segundo paso al intento de recuperación emitido por backend.
  const [recoveryToken, setRecoveryToken] = useState('');
  // Estos dos valores permiten decirle al usuario por dónde fue enviado el código.
  const [resetChannel, setResetChannel] = useState('');
  const [resetDestinationHint, setResetDestinationHint] = useState('');
  // `pendingIdentifier` guarda el identificador validado en el paso recover para usarlo en chooseChannel.
  const [pendingIdentifier, setPendingIdentifier] = useState('');
  // Los toggles separan la visibilidad de la contraseña actual y la nueva.
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  // `error` y `notice` pintan feedback contextual según el paso actual.
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Se usa un único flag para deshabilitar envíos simultáneos.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  useBodyScrollLock(isOpen);

  // El modal se desmonta por completo cuando no está abierto.
  if (!isOpen) return null;

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  const goToLogin = () => {
    // Al volver al login se limpia cualquier residuo del flujo de recuperación.
    clearMessages();
    setRecoveryToken('');
    setResetChannel('');
    setResetDestinationHint('');
    setPendingIdentifier('');
    setMode('login');
  };

  const goToRecover = () => {
    // Si el usuario ya escribió un correo en login, se reutiliza como pista inicial.
    clearMessages();
    setResetIdentifier(email.trim().toLowerCase());
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryToken('');
    setResetChannel('');
    setResetDestinationHint('');
    setPendingIdentifier('');
    setMode('recover');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      // El contexto resuelve si autentica vía backend o fallback local.
      const res = await login(email, password);
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesión. Intenta nuevamente.');
      console.error('Error en login:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    if (!credential) {
      setError('Google no devolvio un token valido.');
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const res = await loginWithGoogle({ idToken: credential });
      if (res.success) {
        onClose();
      } else {
        // Si el backend pide empresa/teléfono, guardamos el token y pedimos esos datos.
        const needsExtra =
          res.mode === 'register' &&
          (res.requiresCompanyName || res.requiresPhone);
        if (needsExtra) {
          setPendingGoogleToken(credential);
          setGoogleEmpresa('');
          setGoogleTelefono('');
          setMode('googleComplete');
        } else {
          setError(res.message || 'No se pudo iniciar sesión con Google.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleComplete = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      const res = await loginWithGoogle({
        idToken: pendingGoogleToken,
        empresa: googleEmpresa,
        telefono: googleTelefono,
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'No se pudo completar el registro con Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    // El identificador puede ser correo o teléfono según lo que el usuario recuerde.
    const normalizedIdentifier = resetIdentifier.trim();

    if (!isValidRecoveryIdentifier(normalizedIdentifier)) {
      setError('Ingresa un correo o telefono valido.');
      return;
    }

    // Con el identificador validado, se pasa a elegir el canal antes de llamar al backend.
    setPendingIdentifier(normalizedIdentifier);
    clearMessages();
    setMode('chooseChannel');
  };

  const handleChannelSelect = async (channel) => {
    clearMessages();
    setIsSubmitting(true);

    try {
      // El backend recibe el identificador y el canal elegido por el usuario.
      const res = await authService.solicitarRecuperacionConCanal(pendingIdentifier, channel);

      if (res.success) {
        if (res.data?.recoveryToken) {
          // Si hay token, el backend ya emitió el OTP y podemos pasar al paso de reset.
          setRecoveryToken(res.data.recoveryToken);
          setResetChannel(res.data.channel || channel);
          setResetDestinationHint(res.data.destinationHint || '');
          setResetCode('');
          setNewPassword('');
          setConfirmPassword('');
          setNotice(res.message || 'Codigo enviado.');
          setMode('reset');
        } else {
          // Respuesta genérica para no filtrar si la cuenta realmente existe.
          setNotice(res.message || 'Si existe una cuenta asociada, enviaremos un codigo al contacto registrado.');
        }
      } else {
        setError(res.message || 'No se pudo enviar el codigo.');
      }
    } catch (err) {
      setError('Error inesperado al solicitar recuperacion.');
      console.error('Error solicitando recuperacion de cuenta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    // El código se limpia para evitar espacios y caracteres extraños.
    const normalizedCode = resetCode.trim();

    if (!recoveryToken) {
      setError('Solicita un nuevo codigo de recuperacion antes de continuar.');
      return;
    }

    if (normalizedCode.length !== 6) {
      setError('Ingresa el codigo de 6 digitos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      // El backend valida token, OTP y contraseña nueva en una sola operación.
      const res = await authService.restablecerPassword(recoveryToken, normalizedCode, newPassword);

      if (res.success) {
        // Se deja precargado el correo recuperado para facilitar el login posterior.
        setEmail(res.data?.email || '');
        setPassword('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetIdentifier('');
        setRecoveryToken('');
        setResetChannel('');
        setResetDestinationHint('');
        setNotice(res.message || 'Contraseña actualizada. Ya puedes iniciar sesión.');
        setMode('login');
      } else {
        setError(res.message || 'No se pudo actualizar la contrasena.');
      }
    } catch (err) {
      setError('Error inesperado al restablecer la contrasena.');
      console.error('Error restableciendo contrasena:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleByMode = {
    login: 'Iniciar sesión',
    recover: 'Recuperar Cuenta',
    chooseChannel: 'Enviar Codigo',
    reset: 'Nueva contraseña',
    googleComplete: 'Completar Registro',
  };

  return (
    <div
      className="auth-modal-viewport safe-area-px safe-area-py fixed inset-0 z-[90] box-border flex items-start justify-center overflow-hidden bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        data-scroll-lock-allow="true"
        className="ios-touch-scroll auth-modal-scroll max-h-full w-full max-w-md overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <div className="sticky top-0 z-10 flex justify-between items-center border-b border-gray-100 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            {mode !== 'login' && (
              <button
                type="button"
                onClick={goToLogin}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Volver a iniciar sesión"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 id="login-modal-title" className="text-2xl font-bold text-syntix-navy">{titleByMode[mode]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon -mr-2"
            aria-label="Cerrar inicio de sesión"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
            {/* Error de negocio o validación del backend/local fallback. */}
            {error && <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">{error}</div>}
            {/* Aviso positivo como recuperación completada o código enviado. */}
            {notice && <div className="p-3 bg-green-50 text-syntix-green text-sm rounded-lg border border-green-100">{notice}</div>}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electronico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="field-control pl-10" placeholder="admin@empresa.com" />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="login-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="field-control pl-10 pr-12" placeholder="••••••••" />
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
              <button type="button" onClick={goToRecover} className="mt-2 text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline">
                ¿Olvidaste tu contrasena?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary mt-6 w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Accediendo...
                </>
              ) : (
                'Acceder'
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">o continuar con</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleAuthButton
                // El modal solo transforma el credential de Google en login federado del contexto.
                onSuccess={handleGoogleLogin}
                onError={(message) => setError(message || 'No se pudo completar la autenticacion con Google.')}
                disabled={isSubmitting}
                text="signin_with"
              />
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              ¿No tienes cuenta? <button type="button" onClick={onSwitchToRegister} className="font-semibold text-blue-700 hover:text-blue-900 hover:underline">Registrate</button>
            </p>
          </form>
        )}

        {mode === 'recover' && (
          <form onSubmit={handleRecoverSubmit} className="space-y-4 p-5 sm:p-6">
            {error && <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">{error}</div>}
            {notice && <div className="p-3 bg-green-50 text-syntix-green text-sm rounded-lg border border-green-100">{notice}</div>}
            <div>
              <label htmlFor="login-recovery-identifier" className="block text-sm font-medium text-gray-700 mb-1">Correo o Telefono</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="login-recovery-identifier" type="text" required value={resetIdentifier} onChange={e => setResetIdentifier(e.target.value)} className="field-control pl-10" placeholder="admin@empresa.com o 3001234567" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {/* Se deja explícito que ambos canales apuntan a la misma cuenta. */}
                Puedes iniciar la recuperacion con el correo registrado o con el telefono asociado a tu cuenta.
              </p>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary mt-6 w-full">
              {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>) : 'Continuar'}
            </button>
          </form>
        )}

        {mode === 'chooseChannel' && (
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
                  <p className="text-xs text-gray-500 mt-0.5">electronico</p>
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
                  <p className="text-xs text-gray-500 mt-0.5">mensaje de texto</p>
                </div>
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              El codigo expira en 10 minutos.
            </p>
          </div>
        )}

        {mode === 'googleComplete' && (
          <form onSubmit={handleGoogleComplete} className="space-y-4 p-5 sm:p-6">
            {error && <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">{error}</div>}
            <p className="text-sm text-gray-600">
              Para crear tu cuenta con Google necesitamos estos datos adicionales.
            </p>

            <div>
              <label htmlFor="google-empresa" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
              <input
                id="google-empresa"
                type="text"
                required
                value={googleEmpresa}
                onChange={e => setGoogleEmpresa(e.target.value)}
                className="field-control"
                placeholder="Mi Empresa S.A.S."
              />
            </div>

            <div>
              <label htmlFor="google-telefono" className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input
                id="google-telefono"
                type="tel"
                required
                value={googleTelefono}
                onChange={e => setGoogleTelefono(e.target.value)}
                className="field-control"
                placeholder="3001234567"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary mt-2 w-full"
            >
              {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Creando cuenta...</>) : 'Crear cuenta'}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4 p-5 sm:p-6">
            {error && <div className="p-3 bg-red-50 text-syntix-red text-sm rounded-lg border border-red-100">{error}</div>}
            {notice && <div className="p-3 bg-green-50 text-syntix-green text-sm rounded-lg border border-green-100">{notice}</div>}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>
                {/* Este texto confirma si el backend tuvo que degradar de email a SMS. */}
                {resetChannel === 'sms' ? 'SMS enviado a ' : 'Codigo enviado a '}
                {resetDestinationHint || 'tu contacto registrado'}
              </span>
            </div>

            <div>
              <label htmlFor="login-reset-code" className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
              <input id="login-reset-code" type="text" inputMode="numeric" maxLength={6} required value={resetCode} onChange={e => setResetCode(getDigitsOnly(e.target.value).slice(0, 6))} className="field-control text-center font-semibold tracking-[0.45em]" placeholder="000000" />
            </div>

            <div>
              <label htmlFor="login-new-password" className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="login-new-password" type={showNewPassword ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="field-control pl-10 pr-12" placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label={showNewPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  title={showNewPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="login-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="login-confirm-password" type={showNewPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="field-control pl-10" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary mt-6 w-full">
              {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Actualizando...</>) : 'Actualizar contrasena'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

LoginModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSwitchToRegister: PropTypes.func.isRequired,
};
