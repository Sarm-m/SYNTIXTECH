const nodemailer = require('nodemailer');

const EMAIL_USER = String(process.env.EMAIL_USER || '').trim();
const EMAIL_PASS = String(process.env.EMAIL_PASS || '');
const EMAIL_HOST = String(process.env.EMAIL_HOST || '').trim();
const configuredPort = Number(process.env.EMAIL_PORT);
const EMAIL_PORT = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535
  ? configuredPort
  : null;
const EMAIL_SECURE = String(process.env.EMAIL_SECURE || '').trim().toLowerCase() === 'true'
  || EMAIL_PORT === 465;
const EMAIL_ENABLED = Boolean(EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS);
const transporter = EMAIL_ENABLED
  ? nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  })
  : null;

const escapeHtml = (value) => String(value || '').replace(
  /[&<>"']/g,
  (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]
);

const expirationMinutes = escapeHtml(process.env.OTP_EXPIRACION_MINUTOS || 10);

const assertEmailEnabled = () => {
  if (!EMAIL_ENABLED) {
    throw new Error('Servicio de correo no configurado correctamente.');
  }
};

const sendTransactionalEmail = async (mailOptions, eventLabel, requireAccepted = true) => {
  assertEmailEnabled();
  const info = await transporter.sendMail(mailOptions);
  const accepted = Array.isArray(info.accepted) ? info.accepted : [];
  const rejected = Array.isArray(info.rejected) ? info.rejected : [];

  if ((requireAccepted && accepted.length === 0) || rejected.length > 0) {
    throw new Error('SMTP no confirmo la entrega del correo.');
  }

  console.log(`[EMAIL] ${eventLabel} enviado.`);
};

const buildOtpEmail = ({ recipientName, code, title, introduction, footer }) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #1e3a5f;">${title}</h2>
    <p style="color: #374151;">Hola ${escapeHtml(recipientName)}, ${introduction}</p>
    <div style="text-align: center; margin: 32px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1e3a5f; background: #f3f4f6; padding: 16px 24px; border-radius: 8px;">${escapeHtml(code)}</span>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Este codigo expira en <strong>${expirationMinutes} minutos</strong>.</p>
    <p style="color: #6b7280; font-size: 14px;">${footer}</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">Drive Control &mdash; Sistema de gestion logistica</p>
  </div>
`;

async function verificarServicioCorreo() {
  if (!EMAIL_ENABLED) {
    return {
      ok: false,
      configured: false,
      reason: 'missing_configuration',
    };
  }

  try {
    await transporter.verify();
    return {
      ok: true,
      configured: true,
    };
  } catch {
    return {
      ok: false,
      configured: true,
      reason: 'verify_failed',
    };
  }
}

async function enviarCodigoVerificacion(email, nombre, codigo) {
  await sendTransactionalEmail({
    from: `"Drive Control" <${EMAIL_USER}>`,
    to: email,
    subject: 'Codigo de verificacion - Drive Control',
    html: buildOtpEmail({
      recipientName: nombre || email,
      code: codigo,
      title: 'Bienvenido a Drive Control',
      introduction: 'ingresa el siguiente codigo de verificacion para activar tu cuenta:',
      footer: 'Si no creaste esta cuenta, puedes ignorar este correo.',
    }),
  }, 'OTP de verificacion');
}

async function enviarCodigoRecuperacion(email, nombre, codigo) {
  await sendTransactionalEmail({
    from: `"Drive Control" <${EMAIL_USER}>`,
    to: email,
    subject: 'Codigo para recuperar tu cuenta - Drive Control',
    html: buildOtpEmail({
      recipientName: nombre || email,
      code: codigo,
      title: 'Recuperacion de cuenta',
      introduction: 'usa este codigo para restablecer tu contrasena:',
      footer: 'Si no solicitaste este cambio, puedes ignorar este correo.',
    }),
  }, 'OTP de recuperacion');
}

async function enviarCodigoCambioEmail(email, nombre, codigo) {
  await sendTransactionalEmail({
    from: `"Drive Control" <${EMAIL_USER}>`,
    to: email,
    subject: 'Codigo para confirmar tu nuevo correo - Drive Control',
    html: buildOtpEmail({
      recipientName: nombre || email,
      code: codigo,
      title: 'Confirmacion de nuevo correo',
      introduction: 'usa este codigo para confirmar el cambio de correo en Drive Control:',
      footer: 'Si no solicitaste este cambio, ignora este correo.',
    }),
  }, 'OTP de cambio de correo');
}

async function enviarAvisoCambioCorreo(email, nombre, nuevoEmailEnmascarado) {
  if (!EMAIL_ENABLED) return;

  await sendTransactionalEmail({
    from: `"Drive Control" <${EMAIL_USER}>`,
    to: email,
    subject: 'Solicitud de cambio de correo - Drive Control',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1e3a5f;">Aviso de seguridad</h2>
        <p style="color: #374151;">Hola ${escapeHtml(nombre || email)}, se solicito un cambio de correo hacia <strong>${escapeHtml(nuevoEmailEnmascarado)}</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">Si no fuiste tu, contacta al administrador del sistema de inmediato.</p>
      </div>
    `,
  }, 'Aviso de cambio de correo', false);
}

module.exports = {
  enviarCodigoVerificacion,
  enviarCodigoRecuperacion,
  enviarCodigoCambioEmail,
  enviarAvisoCambioCorreo,
  verificarServicioCorreo,
};
