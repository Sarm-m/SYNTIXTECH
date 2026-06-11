import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Building2,
  Car,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  TriangleAlert,
  User,
  Users,
  UserCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useVehicles } from '@/hooks/useVehicles.js';
import { useConductors } from '@/hooks/useConductors.js';
import { useAlerts } from '@/hooks/useAlerts.js';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { isValidColombianMobile, sanitizePhone } from '@/utils/colombiaFormats.js';
import { isValidEmailFormat } from '@/utils/emailValidation.js';
import {
  OTP_LENGTH,
  createEmptyOtp,
  getOtpCode,
  getOtpNavigationTarget,
  getNextOtpFocusIndex,
  isCompleteOtp,
  normalizeOtpCode,
  splitOtpDigits,
} from '@/utils/otpCode.js';

export default function UserProfilePage() {
  const {
    user,
    token,
    loading,
    updateProfile,
    requestEmailChange,
    verifyEmailChange,
    clearError,
  } = useAuth();
  const { vehiculos } = useVehicles();
  const { conductores } = useConductors();
  const { alerts } = useAlerts();
  const { isDarkMode } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [emailStep, setEmailStep] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState(createEmptyOtp());
  const otpInputRefs = useRef([]);

  const canUseBackend = Boolean(token);
  const requiresCurrentPassword = user?.hasPassword === true;
  const isGoogleOnlyAccount = user?.authProvider === 'google';

  useEffect(() => {
    setProfileForm({
      nombre: user?.nombre || '',
      empresa: user?.empresa || '',
      telefono: user?.telefono || '',
    });
  }, [user]);

  const stats = useMemo(
    () => [
      { label: 'Vehiculos registrados', value: vehiculos.length, icon: Car, tone: isDarkMode ? 'text-slate-100' : 'text-syntix-navy' },
      { label: 'Conductores activos', value: conductores.length, icon: Users, tone: 'text-syntix-green' },
      { label: 'Alertas pendientes', value: alerts.length, icon: TriangleAlert, tone: 'text-syntix-red' },
    ],
    [vehiculos.length, conductores.length, alerts.length, isDarkMode]
  );

  const recentVehicles = useMemo(() => vehiculos.slice(-3).reverse(), [vehiculos]);

  const userInitial = useMemo(
    () => String(user?.empresa || user?.email || 'U').charAt(0).toUpperCase(),
    [user?.empresa, user?.email]
  );

  const resetEmailFlow = useCallback(() => {
    setEmailStep(null);
    setNewEmail('');
    setCurrentPassword('');
    setEmailNotice('');
    setEmailError('');
    setOtp(createEmptyOtp());
    clearError();
  }, [clearError]);

  const handleStartEdit = () => {
    setProfileMessage('');
    setProfileError('');
    setProfileForm({
      nombre: user?.nombre || '',
      empresa: user?.empresa || '',
      telefono: user?.telefono || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileError('');
    setProfileForm({
      nombre: user?.nombre || '',
      empresa: user?.empresa || '',
      telefono: user?.telefono || '',
    });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileMessage('');
    setProfileError('');

    if (!canUseBackend) {
      setProfileError('La edicion de perfil requiere una sesion conectada al backend.');
      return;
    }

    const telefono = sanitizePhone(profileForm.telefono);

    if (!isValidColombianMobile(telefono)) {
      setProfileError('El celular debe tener 10 digitos e iniciar por 3.');
      return;
    }

    const result = await updateProfile({
      nombre: profileForm.nombre.trim(),
      empresa: profileForm.empresa.trim(),
      telefono,
    });

    if (result.success) {
      setProfileMessage(result.message || 'Perfil actualizado correctamente.');
      setIsEditing(false);
      return;
    }

    setProfileError(result.message || 'No se pudo actualizar el perfil.');
  };

  const handleRequestEmailChange = async (event) => {
    event.preventDefault();
    setEmailNotice('');
    setEmailError('');

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!isValidEmailFormat(normalizedEmail)) {
      setEmailError('Ingresa un correo electronico valido.');
      return;
    }

    if (normalizedEmail === user?.email) {
      setEmailError('El nuevo correo debe ser diferente al actual.');
      return;
    }

    if (requiresCurrentPassword && !currentPassword.trim()) {
      setEmailError('Ingresa tu contrasena actual para continuar.');
      return;
    }

    const result = await requestEmailChange(
      normalizedEmail,
      requiresCurrentPassword ? currentPassword : ''
    );

    if (!result.success) {
      setEmailError(result.message);
      return;
    }

    setEmailNotice(result.message || 'Te enviamos un codigo al nuevo correo.');
    setEmailStep('verify');
    setOtp(createEmptyOtp());
    setTimeout(() => otpInputRefs.current[0]?.focus(), 0);
  };

  const applyOtpValue = (value) => {
    const nextOtp = splitOtpDigits(value);
    setOtp(nextOtp);
    const nextIndex = getNextOtpFocusIndex(nextOtp);
    setTimeout(() => otpInputRefs.current[nextIndex]?.focus(), 0);
  };

  const handleOtpChange = (index, value) => {
    const normalizedValue = normalizeOtpCode(value);
    if (!normalizedValue && value) return;

    const nextOtp = [...otp];
    nextOtp[index] = normalizedValue.slice(-1);
    setOtp(nextOtp);

    if (normalizedValue && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    const target = getOtpNavigationTarget(index, event.key, otp[index]);

    if (target === 'prev') {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    }

    if (target === 'next') {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    applyOtpValue(event.clipboardData.getData('text'));
  };

  const handleVerifyEmailChange = async (event) => {
    event.preventDefault();
    setEmailNotice('');
    setEmailError('');

    if (!isCompleteOtp(otp)) {
      setEmailError('Ingresa el codigo de 6 digitos.');
      return;
    }

    const result = await verifyEmailChange(newEmail.trim().toLowerCase(), getOtpCode(otp));

    if (!result.success) {
      setEmailError(result.message);
      return;
    }

    setEmailNotice(result.message || 'Correo actualizado correctamente.');
    resetEmailFlow();
  };

  const cardClass = isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white';
  const inputClass = 'field-control';

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Perfil | DriveControl</title>
      </Helmet>

      <section className={`overflow-hidden rounded-3xl border shadow-sm ${cardClass}`}>
        <div className={`flex flex-col gap-6 px-6 py-8 text-white lg:flex-row lg:items-center lg:justify-between ${
          isDarkMode ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800' : 'bg-gradient-to-r from-syntix-navy to-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-3xl font-bold">
              {userInitial}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Perfil de usuario</p>
              <h1 className="mt-2 text-3xl font-bold">{user?.empresa || 'Usuario autenticado'}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Administra tus datos de contacto y solicita cambios de correo con verificacion por codigo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ThemeToggle compact label="Modo oscuro" />
            <Link to="/vehiculos" className="btn-secondary min-h-10">
              Ver vehiculos
            </Link>
            <Link to="/configuracion" className="btn-outline min-h-10 border-white/20 text-white hover:bg-white/10">
              Ir a configuracion
            </Link>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Datos de cuenta</h2>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  disabled={!canUseBackend}
                  className="btn-primary"
                >
                  Editar perfil
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                    isDarkMode ? 'border-slate-700 text-slate-200' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Cancelar
                </button>
              )}
            </div>

            {!canUseBackend && (
              <p className={`rounded-xl border px-4 py-3 text-sm ${
                isDarkMode ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}>
                La edicion remota requiere iniciar sesion con el backend activo.
              </p>
            )}

            {profileMessage && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {profileMessage}
              </p>
            )}

            {profileError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileError}
              </p>
            )}

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <label className="block space-y-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>Nombre</span>
                  <input
                    type="text"
                    value={profileForm.nombre}
                    onChange={(event) => setProfileForm((current) => ({ ...current, nombre: event.target.value }))}
                    className={inputClass}
                    maxLength={80}
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>Empresa</span>
                  <input
                    type="text"
                    value={profileForm.empresa}
                    onChange={(event) => setProfileForm((current) => ({ ...current, empresa: event.target.value }))}
                    className={inputClass}
                    maxLength={120}
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>Telefono</span>
                  <input
                    type="tel"
                    value={profileForm.telefono}
                    onChange={(event) => setProfileForm((current) => ({
                      ...current,
                      telefono: sanitizePhone(event.target.value),
                    }))}
                    className={inputClass}
                    maxLength={10}
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar cambios
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <ProfileField icon={User} label="Nombre" value={user?.nombre || 'Sin informacion registrada'} isDarkMode={isDarkMode} />
                <ProfileField icon={Building2} label="Empresa" value={user?.empresa || 'Sin informacion registrada'} isDarkMode={isDarkMode} />
                <ProfileField icon={Mail} label="Correo" value={user?.email || 'Sin correo disponible'} isDarkMode={isDarkMode} />
                <ProfileField icon={Phone} label="Telefono" value={user?.telefono || 'Sin telefono disponible'} isDarkMode={isDarkMode} />
                <ProfileField icon={ShieldCheck} label="Rol" value={user?.role || 'Sin rol disponible'} isDarkMode={isDarkMode} readOnly />
              </div>
            )}

            {!isEditing && (
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Correo electronico</p>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      El cambio de correo requiere un codigo enviado al nuevo email.
                    </p>
                  </div>
                  {!emailStep && (
                    <button
                      type="button"
                      onClick={() => {
                        resetEmailFlow();
                        setEmailStep('request');
                      }}
                      disabled={!canUseBackend}
                      className="btn-outline"
                    >
                      Cambiar correo
                    </button>
                  )}
                </div>

                {emailStep === 'request' && (
                  <form onSubmit={handleRequestEmailChange} className="mt-4 space-y-3">
                    {isGoogleOnlyAccount && (
                      <p className={`rounded-xl border px-4 py-3 text-sm ${
                        isDarkMode ? 'border-blue-500/40 bg-blue-500/10 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-800'
                      }`}>
                        Tu cuenta usa Google. Para cambiar el correo, verificaremos el nuevo email con un codigo.
                      </p>
                    )}
                    <label className="block space-y-2">
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>Nuevo correo</span>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(event) => setNewEmail(event.target.value)}
                        className={inputClass}
                        required
                      />
                    </label>
                    {requiresCurrentPassword && (
                      <label className="block space-y-2">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>Contrasena actual</span>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(event) => setCurrentPassword(event.target.value)}
                          className={inputClass}
                          placeholder="Obligatoria para cuentas con password local"
                          required
                        />
                      </label>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Enviar codigo
                      </button>
                      <button type="button" onClick={resetEmailFlow} className="text-sm font-semibold text-gray-500 hover:underline">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {emailStep === 'verify' && (
                  <form onSubmit={handleVerifyEmailChange} className="mt-4 space-y-3">
                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      Ingresa el codigo enviado a <strong>{newEmail}</strong>.
                    </p>
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            otpInputRefs.current[index] = element;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          onChange={(event) => handleOtpChange(index, event.target.value)}
                          onKeyDown={(event) => handleOtpKeyDown(index, event)}
                          onPaste={handleOtpPaste}
                          className="h-14 w-12 rounded-lg border-2 border-gray-300 text-center text-2xl font-bold text-syntix-navy outline-none focus:border-syntix-blue focus:ring-2 focus:ring-syntix-blue"
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Verificar y cambiar correo
                      </button>
                      <button type="button" onClick={resetEmailFlow} className="text-sm font-semibold text-gray-500 hover:underline">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {emailNotice && (
                  <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {emailNotice}
                  </p>
                )}

                {emailError && (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {emailError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={`rounded-2xl border border-dashed p-5 ${
            isDarkMode ? 'border-slate-700 bg-slate-950/60' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <UserCircle2 className={`h-5 w-5 ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`} />
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Seguridad</h2>
            </div>
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              El rol es un atributo de autorizacion y solo se muestra en lectura. Los cambios de correo actualizan
              automaticamente los datos asociados a tu cuenta en la plataforma.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className={`rounded-2xl border p-5 shadow-sm ${cardClass}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{stat.label}</p>
                <p className={`mt-2 text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.tone}`} />
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <article className={`rounded-2xl border p-5 shadow-sm ${cardClass}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Vehiculos recientes</h2>
            <Link to="/vehiculos" className={`text-sm font-semibold hover:underline ${isDarkMode ? 'text-slate-200' : 'text-syntix-navy'}`}>
              Ver todos
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentVehicles.length > 0 ? (
              recentVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${
                    isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{vehicle.placa}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {vehicle.marca} {vehicle.modelo} - {vehicle.tipo}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-600'
                  }`}>
                    {vehicle.estadoGeneral || 'sin estado'}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState text="Todavia no hay vehiculos registrados para mostrar en tu perfil." isDarkMode={isDarkMode} />
            )}
          </div>
        </article>

        <article className={`rounded-2xl border p-5 shadow-sm ${cardClass}`}>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Resumen operativo</h2>
          <p className={`mt-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Los vehiculos, conductores y documentos permanecen vinculados a tu correo verificado despues de cualquier actualizacion de perfil.
          </p>
        </article>
      </section>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value, isDarkMode, readOnly = false }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
      isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-gray-100 bg-gray-50'
    }`}>
      <div className={`rounded-xl p-2 shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-syntix-navy'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {label}
          {readOnly ? ' (solo lectura)' : ''}
        </p>
        <p className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text, isDarkMode }) {
  return (
    <div className={`rounded-2xl border border-dashed px-4 py-6 text-sm ${
      isDarkMode ? 'border-slate-700 bg-slate-950/60 text-slate-400' : 'border-gray-200 bg-gray-50 text-gray-500'
    }`}>
      {text}
    </div>
  );
}

ProfileField.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool,
};

EmptyState.propTypes = {
  text: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};
