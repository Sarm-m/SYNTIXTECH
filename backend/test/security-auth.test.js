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
  usuarioFindOne: models.Usuario.findOne,
  usuarioFindOneAndUpdate: models.Usuario.findOneAndUpdate,
  usuarioFindById: models.Usuario.findById,
  usuarioSave: models.Usuario.prototype.save,
  verificacionFindOne: models.VerificacionOTP.findOne,
  verificacionFindOneAndDelete: models.VerificacionOTP.findOneAndDelete,
  conductorFind: models.Conductor.find,
  conductorFindOne: models.Conductor.findOne,
  conductorFindOneAndDelete: models.Conductor.findOneAndDelete,
  conductorSave: models.Conductor.prototype.save,
};

const restoreModelStubs = () => {
  models.Usuario.findOne = originalMethods.usuarioFindOne;
  models.Usuario.findOneAndUpdate = originalMethods.usuarioFindOneAndUpdate;
  models.Usuario.findById = originalMethods.usuarioFindById;
  models.Usuario.prototype.save = originalMethods.usuarioSave;
  models.VerificacionOTP.findOne = originalMethods.verificacionFindOne;
  models.VerificacionOTP.findOneAndDelete = originalMethods.verificacionFindOneAndDelete;
  models.Conductor.find = originalMethods.conductorFind;
  models.Conductor.findOne = originalMethods.conductorFindOne;
  models.Conductor.findOneAndDelete = originalMethods.conductorFindOneAndDelete;
  models.Conductor.prototype.save = originalMethods.conductorSave;
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
    _id: user._id || 'user-a',
    email: user.email || 'empresa.a@example.com',
    empresa: user.empresa || 'Empresa A',
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
  helpers.setGoogleIdentityVerifierForTest(null);
  restoreModelStubs();
});

test('registro publico crea usuario pendiente con rol seguro e ignora role del cliente', async () => {
  let savedUser;

  models.Usuario.findOne = async () => null;
  models.Usuario.prototype.save = async function saveUserStub() {
    savedUser = this;
    return this;
  };

  const result = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email: 'nuevo@example.com',
      password: 'secret123',
      nombre: 'Nuevo Usuario',
      empresa: 'Empresa Nueva',
      telefono: '3001234567',
      role: 'admin',
    },
  });

  assert.equal(result.status, 201);
  assert.equal(savedUser.email, 'nuevo@example.com');
  assert.equal(savedUser.isVerified, false);
  assert.equal(savedUser.role, 'user');
  assert.equal(savedUser.hasLocalPassword, true);
  assert.equal(result.data.data?.token, undefined);
  assert.equal(result.data.data?.user, undefined);
});

test('login tradicional rechaza usuario no verificado y no emite token', async () => {
  models.Usuario.findOne = async (query) => ({
    _id: 'unverified-user',
    email: query.email,
    empresa: 'Empresa Demo',
    telefono: '3000000000',
    role: 'user',
    isVerified: false,
    comparePassword: async () => true,
  });

  const result = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'sinverificar@example.com',
      password: 'secret123',
    },
  });

  assert.equal(result.status, 403);
  assert.match(result.data.message, /verificar tu cuenta/i);
  assert.equal(result.data.success, false);
  assert.equal(result.data.data?.token, undefined);
});

test('login tradicional devuelve perfil completo sin password', async () => {
  models.Usuario.findOne = async (query) => ({
    _id: 'local-user',
    nombre: 'Usuario Local',
    email: query.email,
    empresa: 'Empresa Local',
    telefono: '3001234567',
    role: 'admin',
    isVerified: true,
    hasLocalPassword: true,
    password: 'hashed-secret',
    comparePassword: async () => true,
  });

  const result = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'local@example.com',
      password: 'secret123',
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.data.data.user.nombre, 'Usuario Local');
  assert.equal(result.data.data.user.email, 'local@example.com');
  assert.equal(result.data.data.user.isVerified, true);
  assert.equal(result.data.data.user.hasPassword, true);
  assert.equal(result.data.data.user.authProvider, 'local');
  assert.equal(result.data.data.user.password, undefined);
  assert.ok(result.data.data.token);
});

test('Google login nuevo crea cuenta Google-only con perfil completo', async () => {
  let savedUser;

  helpers.setGoogleIdentityVerifierForTest(async () => ({
    email: 'google@example.com',
    email_verified: true,
    name: 'Usuario Google',
    sub: 'google-sub-1',
  }));

  models.Usuario.findOne = async () => null;
  models.Usuario.prototype.save = async function saveGoogleUserStub() {
    savedUser = this;
    return this;
  };

  const result = await request('/api/auth/google', {
    method: 'POST',
    body: {
      idToken: 'fake-google-token',
      empresa: 'Empresa Google',
      telefono: '3001234567',
    },
  });

  assert.equal(result.status, 200);
  assert.equal(savedUser.hasLocalPassword, false);
  assert.equal(result.data.data.user.nombre, 'Usuario Google');
  assert.equal(result.data.data.user.googleId, 'google-sub-1');
  assert.equal(result.data.data.user.hasPassword, false);
  assert.equal(result.data.data.user.authProvider, 'google');
  assert.equal(result.data.data.user.password, undefined);
  assert.equal(result.data.data.created, true);
  assert.equal(result.data.data.mode, 'register');
  assert.equal(result.data.data.requiresCompanyName, false);
  assert.equal(result.data.data.requiresPhone, false);
});

test('Google nuevo sin perfil empresarial solicita completar registro de forma estructurada', async () => {
  let saveCalled = false;

  helpers.setGoogleIdentityVerifierForTest(async () => ({
    email: 'google-nuevo@example.com',
    email_verified: true,
    name: 'Usuario Google Nuevo',
    sub: 'google-sub-new',
  }));

  models.Usuario.findOne = async () => null;
  models.Usuario.prototype.save = async function saveGoogleUserStub() {
    saveCalled = true;
    return this;
  };

  const result = await request('/api/auth/google', {
    method: 'POST',
    body: {
      idToken: 'fake-google-token',
    },
  });

  assert.equal(result.status, 409);
  assert.equal(result.data.success, false);
  assert.equal(result.data.data.mode, 'register');
  assert.equal(result.data.data.requiresCompanyName, true);
  assert.equal(result.data.data.requiresPhone, true);
  assert.equal(saveCalled, false);
});

test('Google login sobre cuenta local conserva perfil y queda mixto', async () => {
  const existingUser = {
    _id: 'mixed-user',
    nombre: 'Nombre Manual',
    email: 'mixto@example.com',
    empresa: 'Empresa Manual',
    telefono: '3007654321',
    role: 'user',
    isVerified: true,
    hasLocalPassword: true,
    googleId: null,
    save: async function saveMixedUserStub() {
      return this;
    },
  };

  helpers.setGoogleIdentityVerifierForTest(async () => ({
    email: 'mixto@example.com',
    email_verified: true,
    name: '',
    sub: 'google-sub-2',
  }));

  models.Usuario.findOne = async () => existingUser;

  const result = await request('/api/auth/google', {
    method: 'POST',
    body: {
      idToken: 'fake-google-token',
      empresa: '',
      telefono: '',
    },
  });

  assert.equal(result.status, 200);
  assert.equal(existingUser.nombre, 'Nombre Manual');
  assert.equal(existingUser.empresa, 'Empresa Manual');
  assert.equal(existingUser.telefono, '3007654321');
  assert.equal(result.data.data.user.googleId, 'google-sub-2');
  assert.equal(result.data.data.user.hasPassword, true);
  assert.equal(result.data.data.user.authProvider, 'mixed');
  assert.equal(result.data.data.created, false);
  assert.equal(result.data.data.mode, 'login');
  assert.equal(result.data.data.requiresCompanyName, false);
  assert.equal(result.data.data.requiresPhone, false);
});

test('Google login reconoce cuenta existente por provider id aunque cambie el correo', async () => {
  const existingUser = {
    _id: 'google-existing-user',
    nombre: 'Usuario Google Existente',
    email: 'correo-anterior@example.com',
    empresa: 'Empresa Existente',
    telefono: '3007654321',
    role: 'user',
    isVerified: true,
    hasLocalPassword: false,
    googleId: 'google-provider-existing',
    save: async function saveGoogleUserStub() {
      return this;
    },
  };
  const lookups = [];

  helpers.setGoogleIdentityVerifierForTest(async () => ({
    email: 'correo-nuevo@example.com',
    email_verified: true,
    name: 'Usuario Google Existente',
    sub: 'google-provider-existing',
  }));

  models.Usuario.findOne = async (query) => {
    lookups.push(query);
    return query.googleId ? existingUser : null;
  };

  const result = await request('/api/auth/google', {
    method: 'POST',
    body: {
      idToken: 'fake-google-token',
    },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(lookups, [
    { email: 'correo-nuevo@example.com' },
    { googleId: 'google-provider-existing' },
  ]);
  assert.equal(result.data.data.mode, 'login');
  assert.equal(result.data.data.created, false);
  assert.equal(result.data.data.user.email, 'correo-anterior@example.com');
});

test('ruta protegida sin token responde 401', async () => {
  const result = await request('/api/conductores');

  assert.equal(result.status, 401);
  assert.match(result.data.message, /autenticacion requerida/i);
});

test('ruta protegida con token invalido responde 401', async () => {
  const result = await request('/api/conductores', { token: 'token-invalido' });

  assert.equal(result.status, 401);
  assert.match(result.data.message, /token invalido/i);
});

test('usuario no verificado con JWT no puede acceder a rutas protegidas', async () => {
  const { token } = useAuthenticatedUser({ isVerified: false });

  const result = await request('/api/conductores', { token });

  assert.equal(result.status, 403);
  assert.match(result.data.message, /verificar tu cuenta/i);
});

test('verificacion correcta activa isVerified sin cambiar el rol a admin', async () => {
  const email = 'pendiente@example.com';
  const storedUser = {
    _id: 'pending-user',
    email,
    empresa: 'Empresa Pendiente',
    telefono: '3001234567',
    role: 'user',
    isVerified: false,
  };
  const codigoHash = await bcrypt.hash('123456', 10);
  let updatePayload;

  models.VerificacionOTP.findOne = async () => ({
    email,
    codigoHash,
    expiresAt: new Date(Date.now() + 60_000),
    intentos: 0,
    save: async () => {},
  });
  models.VerificacionOTP.findOneAndDelete = async () => ({ ok: true });
  models.Usuario.findOneAndUpdate = async (_query, update) => {
    updatePayload = update;
    storedUser.isVerified = update.isVerified;
    return storedUser;
  };
  models.Usuario.findOne = async () => storedUser;

  const result = await request('/api/auth/verificar-codigo', {
    method: 'POST',
    body: {
      email,
      codigo: '123456',
    },
  });

  assert.equal(result.status, 200);
  assert.equal(storedUser.isVerified, true);
  assert.deepEqual(updatePayload, { isVerified: true });
  assert.equal(result.data.data.user.role, 'user');
  assert.notEqual(result.data.data.user.role, 'admin');
  assert.ok(result.data.data.token);
});

test('GET ignora email de query y filtra por el usuario autenticado', async () => {
  const { user, token } = useAuthenticatedUser();
  let receivedQuery;

  models.Conductor.find = async (query) => {
    receivedQuery = query;
    return [
      {
        nombre: 'Conductor A',
        documento: '1234567890',
        ownerEmail: user.email,
      },
    ];
  };

  const result = await request('/api/conductores?email=empresa.b@example.com', { token });

  assert.equal(result.status, 200);
  assert.deepEqual(receivedQuery, { ownerEmail: user.email });
  assert.equal(result.data[0].ownerEmail, user.email);
});

test('ownerEmail enviado por body no sobreescribe el dueno autenticado', async () => {
  const { user, token } = useAuthenticatedUser();
  let savedOwnerEmail;

  models.Conductor.findOne = async (query) => {
    assert.equal(query.ownerEmail, user.email);
    return null;
  };

  models.Conductor.prototype.save = async function saveStub() {
    savedOwnerEmail = this.ownerEmail;
    return this;
  };

  const result = await request('/api/conductores', {
    method: 'POST',
    token,
    body: {
      nombre: 'Conductor Seguro',
      documento: '1234567890',
      telefono: '3001234567',
      categoria: 'B1',
      fechaVencimiento: '2027-12-31',
      ownerEmail: 'empresa.b@example.com',
    },
  });

  assert.equal(result.status, 201);
  assert.equal(savedOwnerEmail, user.email);
});

test('usuario A no puede editar ni borrar recursos de usuario B', async () => {
  const { user, token } = useAuthenticatedUser();
  const editQueries = [];
  const deleteQueries = [];

  models.Conductor.findOne = async (query) => {
    editQueries.push(query);
    return null;
  };

  models.Conductor.findOneAndDelete = async (query) => {
    deleteQueries.push(query);
    return null;
  };

  const updateResult = await request('/api/conductores/64f000000000000000000001', {
    method: 'PUT',
    token,
    body: {
      nombre: 'Intento Edicion',
      documento: '1234567890',
      telefono: '3001234567',
      categoria: 'B1',
      fechaVencimiento: '2027-12-31',
    },
  });

  const deleteResult = await request('/api/conductores/64f000000000000000000002', {
    method: 'DELETE',
    token,
  });

  assert.equal(updateResult.status, 404);
  assert.equal(deleteResult.status, 404);
  assert.equal(editQueries[0].ownerEmail, user.email);
  assert.equal(deleteQueries[0].ownerEmail, user.email);
});

test('duplicados por indice compuesto devuelven mensaje amigable', async () => {
  const { token } = useAuthenticatedUser();

  models.Conductor.findOne = async () => null;
  models.Conductor.prototype.save = async () => {
    const error = new Error('E11000 duplicate key error');
    error.code = 11000;
    throw error;
  };

  const result = await request('/api/conductores', {
    method: 'POST',
    token,
    body: {
      nombre: 'Conductor Duplicado',
      documento: '1234567890',
      telefono: '3001234567',
      categoria: 'B1',
      fechaVencimiento: '2027-12-31',
      ownerEmail: 'otro@example.com',
    },
  });

  assert.equal(result.status, 400);
  assert.match(result.data.error, /ya existe un conductor/i);
});

test('PUT /api/auth/user no permite cambiar role', async () => {
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
    save: async function saveProfileStub() {
      return this;
    },
  };
  let findByIdCalls = 0;

  models.Usuario.findById = () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return {
        select: async () => authUser,
      };
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
      role: 'admin',
    },
  });

  assert.equal(result.status, 200);
  assert.equal(persistedUser.role, 'user');
  assert.equal(result.data.data.user.role, 'user');
});

test('/api/health/email no expone usuario ni credenciales SMTP', async () => {
  const result = await request('/api/health/email');
  const serialized = JSON.stringify(result.data);

  assert.equal(result.status, 500);
  assert.equal(result.data.smtp.configured, false);
  assert.doesNotMatch(serialized, /EMAIL_USER|EMAIL_PASS|auth|pass|user/i);
});
