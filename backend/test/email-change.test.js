const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'test';
process.env.SKIP_PROJECT_ENV_LOAD = 'true';
process.env.SKIP_MONGO_CONNECT = 'true';
process.env.JWT_SECRET = 'unit-test-jwt-secret';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/drivectrl_unit_test';
process.env.EMAIL_USER = '';
process.env.EMAIL_PASS = '';

const { app, models, helpers } = require('../server');

let server;
let baseUrl;

const originalMethods = {
  usuarioFindById: models.Usuario.findById,
  usuarioFindOne: models.Usuario.findOne,
  usuarioSave: models.Usuario.prototype.save,
  emailChangeFindOne: models.EmailChangeOTP.findOne,
  emailChangeFindOneAndDelete: models.EmailChangeOTP.findOneAndDelete,
  emailChangeSaveCtor: models.EmailChangeOTP.prototype.save,
  conductorUpdateMany: models.Conductor.updateMany,
  vehiculoUpdateMany: models.Vehiculo.updateMany,
  soatUpdateMany: models.Soat.updateMany,
  rtmUpdateMany: models.Rtm.updateMany,
  validationUpdateMany: models.ValidationHistory.updateMany,
};

const restoreModelStubs = () => {
  models.Usuario.findById = originalMethods.usuarioFindById;
  models.Usuario.findOne = originalMethods.usuarioFindOne;
  models.Usuario.prototype.save = originalMethods.usuarioSave;
  models.EmailChangeOTP.findOne = originalMethods.emailChangeFindOne;
  models.EmailChangeOTP.findOneAndDelete = originalMethods.emailChangeFindOneAndDelete;
  models.EmailChangeOTP.prototype.save = originalMethods.emailChangeSaveCtor;
  models.Conductor.updateMany = originalMethods.conductorUpdateMany;
  models.Vehiculo.updateMany = originalMethods.vehiculoUpdateMany;
  models.Soat.updateMany = originalMethods.soatUpdateMany;
  models.Rtm.updateMany = originalMethods.rtmUpdateMany;
  models.ValidationHistory.updateMany = originalMethods.validationUpdateMany;
};

const request = async (path, { method = 'GET', token, body } = {}) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { status: response.status, data };
};

const useAuthenticatedUser = (user = {}) => {
  const authUser = {
    _id: user._id || 'profile-user',
    email: user.email || 'perfil@example.com',
    empresa: user.empresa || 'Empresa Perfil',
    telefono: user.telefono || '3001234567',
    role: user.role || 'user',
    isVerified: user.isVerified ?? true,
  };

  models.Usuario.findById = () => ({
    select: async () => authUser,
  });

  return {
    user: authUser,
    token: helpers.generateToken(authUser._id),
  };
};

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test.afterEach(() => {
  restoreModelStubs();
});

test('GET /api/auth/me devuelve usuario sin password', async () => {
  const { token } = useAuthenticatedUser({ nombre: 'Usuario Perfil' });
  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return { select: async () => ({ _id: 'profile-user', email: 'perfil@example.com', role: 'user', isVerified: true }) };
    }

    return {
      select: async () => ({
        _id: 'profile-user',
        nombre: 'Usuario Perfil',
        email: 'perfil@example.com',
        empresa: 'Empresa Perfil',
        telefono: '3001234567',
        role: 'admin',
        isVerified: true,
        password: 'hashed-secret',
      }),
    };
  };

  const result = await request('/api/auth/me', { token });

  assert.equal(result.status, 200);
  assert.equal(result.data.data.user.email, 'perfil@example.com');
  assert.equal(result.data.data.user.role, 'admin');
  assert.equal(result.data.data.user.password, undefined);
});

test('PUT /api/auth/user ignora role e isVerified del body', async () => {
  const token = helpers.generateToken('profile-user');
  const authUser = {
    _id: 'profile-user',
    email: 'perfil@example.com',
    empresa: 'Empresa Perfil',
    role: 'user',
    isVerified: true,
  };
  const persistedUser = {
    ...authUser,
    nombre: 'Nombre Perfil',
    telefono: '3000000000',
    isVerified: true,
    save: async function saveProfileStub() {
      return this;
    },
  };
  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return { select: async () => authUser };
    }

    return Promise.resolve(persistedUser);
  };

  const result = await request('/api/auth/user', {
    method: 'PUT',
    token,
    body: {
      nombre: 'Nombre Perfil',
      empresa: 'Empresa Actualizada',
      telefono: '3001234567',
      email: 'intruso@example.com',
      role: 'admin',
      isVerified: false,
      password: 'nueva-password',
      googleId: 'google-intruso',
    },
  });

  assert.equal(result.status, 200);
  assert.equal(persistedUser.nombre, 'Nombre Perfil');
  assert.equal(persistedUser.empresa, 'Empresa Actualizada');
  assert.equal(persistedUser.telefono, '3001234567');
  assert.equal(persistedUser.email, 'perfil@example.com');
  assert.equal(persistedUser.role, 'user');
  assert.equal(persistedUser.isVerified, true);
  assert.equal(persistedUser.googleId, undefined);
  assert.match(result.data.message, /actualizado/i);
  assert.equal(result.data.data.user.password, undefined);
});

test('POST /api/auth/email-change/request exige password para cuenta local', async () => {
  const { token } = useAuthenticatedUser();
  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return { select: async () => ({ _id: 'profile-user', email: 'perfil@example.com', role: 'user', isVerified: true }) };
    }

    return Promise.resolve({
      _id: 'profile-user',
      email: 'perfil@example.com',
      isVerified: true,
      hasLocalPassword: true,
      comparePassword: async () => true,
    });
  };

  models.Usuario.findOne = async () => null;

  const result = await request('/api/auth/email-change/request', {
    method: 'POST',
    token,
    body: {
      newEmail: 'nuevo@example.com',
    },
  });

  assert.equal(result.status, 400);
  assert.match(result.data.message, /contrasena actual/i);
});

test('POST /api/auth/email-change/request no exige password para cuenta Google-only', async () => {
  const { token } = useAuthenticatedUser();
  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return { select: async () => ({ _id: 'profile-user', email: 'perfil@example.com', role: 'user', isVerified: true }) };
    }

    return Promise.resolve({
      _id: 'profile-user',
      nombre: 'Usuario Google',
      email: 'perfil@example.com',
      isVerified: true,
      googleId: 'google-sub',
      hasLocalPassword: false,
      comparePassword: async () => {
        throw new Error('No debe validar password en Google-only');
      },
    });
  };

  models.Usuario.findOne = async () => null;
  models.EmailChangeOTP.findOne = async () => null;
  models.EmailChangeOTP.findOneAndDelete = async () => ({ ok: true });
  models.EmailChangeOTP.prototype.save = async function saveOtpStub() {
    return this;
  };

  const result = await request('/api/auth/email-change/request', {
    method: 'POST',
    token,
    body: {
      newEmail: 'nuevo@example.com',
    },
  });

  assert.notEqual(result.status, 400);
  assert.doesNotMatch(result.data.message, /contrasena actual/i);
});

test('POST /api/auth/email-change/verify rechaza codigo incorrecto', async () => {
  const { token } = useAuthenticatedUser();
  const codigoHash = await bcrypt.hash('123456', 10);
  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return { select: async () => ({ _id: 'profile-user', email: 'perfil@example.com', role: 'user', isVerified: true }) };
    }

    return Promise.resolve({
      _id: 'profile-user',
      email: 'perfil@example.com',
      isVerified: true,
      save: async () => {},
    });
  };

  models.Usuario.findOne = async () => null;
  models.EmailChangeOTP.findOne = async () => ({
    userId: 'profile-user',
    newEmail: 'nuevo@example.com',
    codigoHash,
    expiresAt: new Date(Date.now() + 60_000),
    intentos: 0,
    save: async () => {},
  });

  const result = await request('/api/auth/email-change/verify', {
    method: 'POST',
    token,
    body: {
      newEmail: 'nuevo@example.com',
      codigo: '000000',
    },
  });

  assert.equal(result.status, 400);
  assert.match(result.data.message, /incorrecto/i);
});

test('POST /api/auth/email-change/verify actualiza correo y ownerEmail asociado', async () => {
  const { token } = useAuthenticatedUser();
  const codigoHash = await bcrypt.hash('654321', 10);
  const ownerUpdates = [];

  const persistedUser = {
    _id: 'profile-user',
    nombre: 'Usuario Perfil',
    email: 'perfil@example.com',
    empresa: 'Empresa Perfil',
    telefono: '3001234567',
    role: 'admin',
    isVerified: true,
    save: async function saveUserStub() {
      return this;
    },
  };

  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return { select: async () => ({ _id: 'profile-user', email: 'perfil@example.com', role: 'admin', isVerified: true }) };
    }

    return Promise.resolve(persistedUser);
  };

  models.Usuario.findOne = async () => null;
  models.EmailChangeOTP.findOne = async () => ({
    userId: 'profile-user',
    newEmail: 'nuevo@example.com',
    codigoHash,
    expiresAt: new Date(Date.now() + 60_000),
    intentos: 0,
    save: async () => {},
  });
  models.EmailChangeOTP.findOneAndDelete = async () => ({ ok: true });

  const trackUpdateMany = (label) => async (filter, update) => {
    ownerUpdates.push({ label, filter, update });
    return { modifiedCount: 1 };
  };

  models.Conductor.updateMany = trackUpdateMany('conductor');
  models.Vehiculo.updateMany = trackUpdateMany('vehiculo');
  models.Soat.updateMany = trackUpdateMany('soat');
  models.Rtm.updateMany = trackUpdateMany('rtm');
  models.ValidationHistory.updateMany = trackUpdateMany('validation');

  const result = await request('/api/auth/email-change/verify', {
    method: 'POST',
    token,
    body: {
      newEmail: 'nuevo@example.com',
      codigo: '654321',
    },
  });

  assert.equal(result.status, 200);
  assert.equal(persistedUser.email, 'nuevo@example.com');
  assert.equal(persistedUser.role, 'admin');
  assert.ok(result.data.data.token);
  assert.equal(result.data.data.user.email, 'nuevo@example.com');
  assert.equal(ownerUpdates.length, 5);
  ownerUpdates.forEach((entry) => {
    assert.deepEqual(entry.filter, { ownerEmail: 'perfil@example.com' });
    assert.deepEqual(entry.update, { $set: { ownerEmail: 'nuevo@example.com' } });
  });
});

test('usuario no verificado no puede solicitar cambio de correo', async () => {
  const { token } = useAuthenticatedUser({ isVerified: false });
  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return { select: async () => ({ _id: 'profile-user', email: 'perfil@example.com', role: 'user', isVerified: false }) };
    }

    return Promise.resolve({
      _id: 'profile-user',
      email: 'perfil@example.com',
      isVerified: false,
      comparePassword: async () => true,
    });
  };

  const result = await request('/api/auth/email-change/request', {
    method: 'POST',
    token,
    body: {
      newEmail: 'nuevo@example.com',
      currentPassword: 'secret123',
    },
  });

  assert.equal(result.status, 403);
});
