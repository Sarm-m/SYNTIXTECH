const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');

const servicePath = require.resolve('../services/emailService');
const originalCreateTransport = nodemailer.createTransport;
const originalConsoleLog = console.log;
const emailEnvKeys = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_SECURE', 'EMAIL_USER', 'EMAIL_PASS'];
const originalEnv = Object.fromEntries(emailEnvKeys.map((key) => [key, process.env[key]]));

const loadEmailService = (env, createTransport) => {
  for (const key of emailEnvKeys) delete process.env[key];
  Object.assign(process.env, env);
  nodemailer.createTransport = createTransport;
  delete require.cache[servicePath];
  return require(servicePath);
};

test.afterEach(() => {
  nodemailer.createTransport = originalCreateTransport;
  console.log = originalConsoleLog;
  delete require.cache[servicePath];

  for (const key of emailEnvKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test('no crea transporte ni expone configuracion cuando SMTP esta incompleto', async () => {
  let createCalls = 0;
  const service = loadEmailService({}, () => {
    createCalls += 1;
    return {};
  });

  const health = await service.verificarServicioCorreo();

  assert.equal(createCalls, 0);
  assert.deepEqual(health, {
    ok: false,
    configured: false,
    reason: 'missing_configuration',
  });
});

test('envia correo escapando HTML y registra solo un evento generico', async () => {
  const sent = [];
  const logs = [];
  const transporter = {
    sendMail: async (mailOptions) => {
      sent.push(mailOptions);
      return { accepted: [mailOptions.to], rejected: [], messageId: 'private-message-id' };
    },
    verify: async () => true,
  };
  const service = loadEmailService({
    EMAIL_HOST: 'smtp.example.test',
    EMAIL_PORT: '587',
    EMAIL_SECURE: 'false',
    EMAIL_USER: 'mailer@example.test',
    EMAIL_PASS: 'private-password',
  }, () => transporter);
  console.log = (...args) => logs.push(args.join(' '));

  await service.enviarCodigoVerificacion('person@example.test', '<script>alert(1)</script>', '123456');

  assert.equal(sent.length, 1);
  assert.match(sent[0].html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(sent[0].html, /<script>/);

  const joinedLogs = logs.join('\n');
  assert.match(joinedLogs, /OTP de verificacion enviado/);
  assert.doesNotMatch(joinedLogs, /person@example\.test|123456|private-message-id|private-password/);
});
