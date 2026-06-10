const assert = require('node:assert/strict');
const test = require('node:test');

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
  vehiculoFind: models.Vehiculo.find,
  vehiculoFindOne: models.Vehiculo.findOne,
  vehiculoFindOneAndDelete: models.Vehiculo.findOneAndDelete,
  vehiculoDeleteMany: models.Vehiculo.deleteMany,
  vehiculoSave: models.Vehiculo.prototype.save,
  vehiculoInsertMany: models.Vehiculo.insertMany,
  vehiculoBulkWrite: models.Vehiculo.bulkWrite,
  conductorFind: models.Conductor.find,
  conductorFindOne: models.Conductor.findOne,
  conductorFindOneAndDelete: models.Conductor.findOneAndDelete,
  conductorDeleteMany: models.Conductor.deleteMany,
  conductorSave: models.Conductor.prototype.save,
  conductorInsertMany: models.Conductor.insertMany,
  conductorBulkWrite: models.Conductor.bulkWrite,
  conductorUpdateMany: models.Conductor.updateMany,
  soatFind: models.Soat.find,
  soatFindOne: models.Soat.findOne,
  soatFindOneAndDelete: models.Soat.findOneAndDelete,
  soatDeleteMany: models.Soat.deleteMany,
  soatSave: models.Soat.prototype.save,
  soatBulkWrite: models.Soat.bulkWrite,
  rtmFind: models.Rtm.find,
  rtmFindOne: models.Rtm.findOne,
  rtmFindOneAndDelete: models.Rtm.findOneAndDelete,
  rtmDeleteMany: models.Rtm.deleteMany,
  rtmSave: models.Rtm.prototype.save,
  rtmBulkWrite: models.Rtm.bulkWrite,
  validationFind: models.ValidationHistory.find,
  validationFindOne: models.ValidationHistory.findOne,
  validationFindOneAndDelete: models.ValidationHistory.findOneAndDelete,
  validationDeleteMany: models.ValidationHistory.deleteMany,
  validationSave: models.ValidationHistory.prototype.save,
  validationBulkWrite: models.ValidationHistory.bulkWrite,
};

const restoreModelStubs = () => {
  models.Usuario.findById = originalMethods.usuarioFindById;
  models.Vehiculo.find = originalMethods.vehiculoFind;
  models.Vehiculo.findOne = originalMethods.vehiculoFindOne;
  models.Vehiculo.findOneAndDelete = originalMethods.vehiculoFindOneAndDelete;
  models.Vehiculo.deleteMany = originalMethods.vehiculoDeleteMany;
  models.Vehiculo.prototype.save = originalMethods.vehiculoSave;
  models.Vehiculo.insertMany = originalMethods.vehiculoInsertMany;
  models.Vehiculo.bulkWrite = originalMethods.vehiculoBulkWrite;
  models.Conductor.find = originalMethods.conductorFind;
  models.Conductor.findOne = originalMethods.conductorFindOne;
  models.Conductor.findOneAndDelete = originalMethods.conductorFindOneAndDelete;
  models.Conductor.deleteMany = originalMethods.conductorDeleteMany;
  models.Conductor.prototype.save = originalMethods.conductorSave;
  models.Conductor.insertMany = originalMethods.conductorInsertMany;
  models.Conductor.bulkWrite = originalMethods.conductorBulkWrite;
  models.Conductor.updateMany = originalMethods.conductorUpdateMany;
  models.Soat.find = originalMethods.soatFind;
  models.Soat.findOne = originalMethods.soatFindOne;
  models.Soat.findOneAndDelete = originalMethods.soatFindOneAndDelete;
  models.Soat.deleteMany = originalMethods.soatDeleteMany;
  models.Soat.prototype.save = originalMethods.soatSave;
  models.Soat.bulkWrite = originalMethods.soatBulkWrite;
  models.Rtm.find = originalMethods.rtmFind;
  models.Rtm.findOne = originalMethods.rtmFindOne;
  models.Rtm.findOneAndDelete = originalMethods.rtmFindOneAndDelete;
  models.Rtm.deleteMany = originalMethods.rtmDeleteMany;
  models.Rtm.prototype.save = originalMethods.rtmSave;
  models.Rtm.bulkWrite = originalMethods.rtmBulkWrite;
  models.ValidationHistory.find = originalMethods.validationFind;
  models.ValidationHistory.findOne = originalMethods.validationFindOne;
  models.ValidationHistory.findOneAndDelete = originalMethods.validationFindOneAndDelete;
  models.ValidationHistory.deleteMany = originalMethods.validationDeleteMany;
  models.ValidationHistory.prototype.save = originalMethods.validationSave;
  models.ValidationHistory.bulkWrite = originalMethods.validationBulkWrite;
};

const request = async (path, { method = 'GET', token, body } = {}) => {
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
};

const useAuthenticatedUser = (user = {}) => {
  const authUser = {
    _id: user._id || 'fleet-user-a',
    email: user.email || 'fleet.a@example.com',
    empresa: user.empresa || 'Fleet A',
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

const validVehiclePayload = (overrides = {}) => ({
  placa: 'abc 123',
  marca: 'Renault',
  modelo: 'Kangoo',
  anio: 2024,
  tipo: 'Van',
  ...overrides,
});

const validSoatPayload = (vehiculoId, overrides = {}) => ({
  vehiculoId,
  numeroPoliza: ' SOAT-001 ',
  aseguradora: 'Seguros Demo',
  fechaExpedicion: '2026-01-01',
  fechaInicioVigencia: '2026-01-02',
  fechaFinVigencia: '2027-01-01',
  ...overrides,
});

const validRtmPayload = (vehiculoId, overrides = {}) => ({
  vehiculoId,
  numeroCertificado: ' RTM-001 ',
  cda: 'CDA Demo',
  fechaExpedicion: '2026-01-01',
  fechaVencimiento: '2027-01-01',
  resultado: 'Aprobado',
  ...overrides,
});

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

test('crear vehiculo valido persiste placa normalizada y ownerEmail autenticado', async () => {
  const { token, user } = useAuthenticatedUser();
  let savedVehicle;

  models.Vehiculo.findOne = async (query) => {
    assert.deepEqual(query, { placa: 'ABC123', ownerEmail: user.email });
    return null;
  };
  models.Vehiculo.prototype.save = async function saveVehicleStub() {
    savedVehicle = this;
    return this;
  };

  const result = await request('/api/vehiculos', {
    method: 'POST',
    token,
    body: validVehiclePayload(),
  });

  assert.equal(result.status, 201);
  assert.equal(savedVehicle.placa, 'ABC123');
  assert.equal(savedVehicle.ownerEmail, user.email);
  assert.equal(savedVehicle.ownerEmpresa, user.empresa);
});

test('importacion operacional usa bulk upserts, conserva ownership y permite reimportar', async () => {
  const { token, user } = useAuthenticatedUser();
  const bulkCalls = [];
  let importAttempt = 0;
  const bulkResult = () => ({
    matchedCount: importAttempt > 0 ? 1 : 0,
    modifiedCount: importAttempt > 0 ? 1 : 0,
    upsertedCount: importAttempt > 0 ? 0 : 1,
    insertedCount: 0,
  });
  const stubBulk = (model) => async (operations, options) => {
    bulkCalls.push({ model, operations, options });
    return bulkResult();
  };

  models.Conductor.bulkWrite = stubBulk('conductores');
  models.Vehiculo.bulkWrite = stubBulk('vehiculos');
  models.Soat.bulkWrite = stubBulk('soats');
  models.Rtm.bulkWrite = stubBulk('rtms');
  models.ValidationHistory.bulkWrite = stubBulk('validaciones');
  models.Conductor.find = async (query) => {
    assert.deepEqual(query, { ownerEmail: user.email, documento: { $in: ['1234567890'] } });
    return [{ _id: 'conductor-0', documento: '1234567890' }];
  };
  models.Vehiculo.find = async (query) => {
    assert.deepEqual(query, { ownerEmail: user.email, placa: { $in: ['ABC123'] } });
    return [{ _id: 'vehicle-0', placa: 'ABC123' }];
  };

  const body = {
    conductores: [{
      nombre: 'Laura Perez',
      documento: '1234567890',
      telefono: '3001234567',
      categoria: 'B1',
      fechaVencimiento: '2027-01-01',
      ownerEmail: 'otro@example.com',
    }],
    vehiculos: [{
      placa: 'abc-123',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2026,
      tipo: 'Pickup',
      conductorDocumento: '1234567890',
      ownerEmail: 'otro@example.com',
    }],
    soats: [{
      placa: 'ABC123',
      numeroPoliza: 'SOAT-001',
      aseguradora: 'SURA',
      fechaExpedicion: '2026-01-01',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2027-01-01',
    }],
    rtms: [{
      placa: 'ABC123',
      numeroCertificado: 'RTM-001',
      cda: 'CDA Norte',
      fechaExpedicion: '2026-01-01',
      fechaVencimiento: '2027-01-01',
      resultado: 'Aprobado',
    }],
    validaciones: [{
      placa: 'ABC123',
      tipo: 'RTM',
      estado: 'Aprobado',
      fecha: '2026-05-22',
      observaciones: 'Sin novedades',
    }],
  };

  const first = await request('/api/import/operational', {
    method: 'POST',
    token,
    body,
  });
  importAttempt += 1;
  const second = await request('/api/import/operational', { method: 'POST', token, body });

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(first.data.conductores.upserted, 1);
  assert.equal(second.data.conductores.updated, 1);
  assert.equal(bulkCalls.length, 10);
  bulkCalls.forEach(({ operations, options }) => {
    assert.deepEqual(options, { ordered: false });
    assert.equal(operations[0].updateOne.upsert, true);
  });

  const conductorUpdate = bulkCalls.find(({ model }) => model === 'conductores').operations[0].updateOne;
  const vehicleUpdate = bulkCalls.find(({ model }) => model === 'vehiculos').operations[0].updateOne;
  const soatUpdate = bulkCalls.find(({ model }) => model === 'soats').operations[0].updateOne;
  const rtmUpdate = bulkCalls.find(({ model }) => model === 'rtms').operations[0].updateOne;
  const validationUpdate = bulkCalls.find(({ model }) => model === 'validaciones').operations[0].updateOne;
  assert.deepEqual(conductorUpdate.filter, { ownerEmail: user.email, documento: '1234567890' });
  assert.equal(conductorUpdate.update.$set.ownerEmail, user.email);
  assert.deepEqual(vehicleUpdate.filter, { ownerEmail: user.email, placa: 'ABC123' });
  assert.equal(vehicleUpdate.update.$set.conductorId, 'conductor-0');
  assert.equal(vehicleUpdate.update.$set.ownerEmail, user.email);
  assert.deepEqual(soatUpdate.filter, { ownerEmail: user.email, vehiculoId: 'vehicle-0' });
  assert.deepEqual(rtmUpdate.filter, { ownerEmail: user.email, vehiculoId: 'vehicle-0' });
  assert.equal(validationUpdate.filter.ownerEmail, user.email);
  assert.equal(validationUpdate.filter.placa, 'ABC123');
});

test('importacion operacional reporta filas invalidas sin tumbar el lote', async () => {
  const { token } = useAuthenticatedUser();
  models.Conductor.bulkWrite = async () => ({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 });
  models.Vehiculo.bulkWrite = async () => ({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 });
  models.Vehiculo.find = async () => [];

  const result = await request('/api/import/operational', {
    method: 'POST',
    token,
    body: {
      conductores: [{ nombre: '', documento: 'malo', telefono: '1', fechaVencimiento: 'ayer' }],
      vehiculos: [{ placa: 'INVALIDA', marca: 'X', modelo: 'Y', anio: 2026 }],
      soats: [{ placa: 'ABC123', numeroPoliza: 'SOAT-001' }],
      rtms: [{ placa: 'ABC123', numeroCertificado: 'RTM-001' }],
    },
  });

  assert.equal(result.status, 201);
  assert.equal(result.data.conductores.errors, 1);
  assert.equal(result.data.vehiculos.errors, 1);
  assert.equal(result.data.soats.errors, 1);
  assert.equal(result.data.rtms.errors, 1);
  assert.match(result.data.errors.join(' '), /fila 2/i);
});

test('importacion operacional reporta fechas, enums y relaciones invalidas por fila', async () => {
  const { token } = useAuthenticatedUser();
  models.Conductor.bulkWrite = async () => ({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 });
  models.Vehiculo.bulkWrite = async () => ({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 });
  models.Vehiculo.find = async () => [];

  const result = await request('/api/import/operational', {
    method: 'POST',
    token,
    body: {
      conductores: [{
        nombre: 'Categoria invalida',
        documento: '1234567890',
        telefono: '3001234567',
        categoria: 'Z9',
        fechaVencimiento: '2027-01-01',
      }],
      soats: [{
        placa: 'ABC123',
        numeroPoliza: 'SOAT-001',
        aseguradora: 'SURA',
        fechaExpedicion: '2028-01-01',
        fechaInicioVigencia: '2026-01-01',
        fechaFinVigencia: '2027-01-01',
      }],
      rtms: [{
        placa: 'ABC123',
        numeroCertificado: 'RTM-001',
        cda: 'CDA',
        fechaExpedicion: '2027-01-02',
        fechaVencimiento: '2027-01-01',
        resultado: 'Desconocido',
      }],
      validaciones: [{
        placa: 'ABC123',
        tipo: 'RUNT',
        estado: 'vigente',
        fecha: 'fecha-invalida',
      }],
    },
  });

  assert.equal(result.status, 201);
  assert.equal(result.data.conductores.errors, 1);
  assert.equal(result.data.soats.errors, 1);
  assert.equal(result.data.rtms.errors, 1);
  assert.equal(result.data.validaciones.errors, 1);
  assert.equal(result.data.errors.length, 4);
});

test('restablecimiento operacional usa deleteMany por ownerEmail y respeta dependencias', async () => {
  const { token, user } = useAuthenticatedUser();
  const calls = [];
  const stubDeleteMany = (model, deletedCount) => async (filter) => {
    assert.deepEqual(filter, { ownerEmail: user.email });
    calls.push(model);
    return { deletedCount };
  };

  models.Soat.deleteMany = stubDeleteMany('soats', 300);
  models.Rtm.deleteMany = stubDeleteMany('rtms', 299);
  models.ValidationHistory.deleteMany = stubDeleteMany('validaciones', 500);
  models.Vehiculo.deleteMany = async (filter) => {
    assert.deepEqual(new Set(calls.slice(0, 3)), new Set(['soats', 'rtms', 'validaciones']));
    assert.deepEqual(filter, { ownerEmail: user.email });
    calls.push('vehiculos');
    return { deletedCount: 300 };
  };
  models.Conductor.deleteMany = async (filter) => {
    assert.deepEqual(new Set(calls.slice(0, 3)), new Set(['soats', 'rtms', 'validaciones']));
    assert.deepEqual(filter, { ownerEmail: user.email });
    calls.push('conductores');
    return { deletedCount: 300 };
  };

  const result = await request('/api/import/operational', {
    method: 'DELETE',
    token,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.data.deleted, {
    soats: 300,
    rtms: 299,
    validaciones: 500,
    vehiculos: 300,
    conductores: 300,
  });
  assert.equal(Number.isInteger(result.data.durationMs), true);
});

test('importacion operacional reutiliza conductores y vehiculos existentes referenciados', async () => {
  const { token, user } = useAuthenticatedUser();
  let vehicleUpdate;
  let soatUpdate;

  models.Conductor.find = async (query) => {
    assert.deepEqual(query, { ownerEmail: user.email, documento: { $in: ['1234567890'] } });
    return [{ _id: 'existing-conductor', documento: '1234567890' }];
  };
  models.Vehiculo.bulkWrite = async (operations) => {
    vehicleUpdate = operations[0].updateOne;
    return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
  };
  models.Vehiculo.find = async (query) => {
    assert.deepEqual(query, { ownerEmail: user.email, placa: { $in: ['ABC123'] } });
    return [{ _id: 'existing-vehicle', placa: 'ABC123' }];
  };
  models.Soat.bulkWrite = async (operations) => {
    soatUpdate = operations[0].updateOne;
    return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
  };

  const result = await request('/api/import/operational', {
    method: 'POST',
    token,
    body: {
      vehiculos: [{
        placa: 'ABC123',
        marca: 'Toyota',
        modelo: 'Hilux',
        anio: 2026,
        tipo: 'Pickup',
        conductorDocumento: '1234567890',
      }],
      soats: [{
        placa: 'ABC123',
        numeroPoliza: 'SOAT-001',
        aseguradora: 'SURA',
        fechaExpedicion: '2026-01-01',
        fechaInicioVigencia: '2026-01-01',
        fechaFinVigencia: '2027-01-01',
      }],
    },
  });

  assert.equal(result.status, 201);
  assert.equal(vehicleUpdate.update.$set.conductorId, 'existing-conductor');
  assert.deepEqual(soatUpdate.filter, { ownerEmail: user.email, vehiculoId: 'existing-vehicle' });
});

test('importacion operacional divide bulkWrite en chunks y rechaza excesos claramente', async () => {
  const { token } = useAuthenticatedUser();
  const bulkSizes = [];
  const conductores = Array.from({ length: 501 }, (_, index) => ({
    nombre: `Conductor ${index}`,
    documento: String(1000000000 + index),
    telefono: `300${String(index).padStart(7, '0')}`,
    categoria: 'B1',
    fechaVencimiento: '2027-01-01',
  }));

  models.Conductor.bulkWrite = async (operations) => {
    bulkSizes.push(operations.length);
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: operations.length };
  };
  models.Conductor.find = async () => conductores.map((record, index) => ({
    _id: `conductor-${index}`,
    documento: record.documento,
  }));

  const chunked = await request('/api/import/operational', {
    method: 'POST',
    token,
    body: { conductores },
  });
  const tooLarge = await request('/api/import/operational', {
    method: 'POST',
    token,
    body: { conductores: Array.from({ length: 10001 }, () => ({})) },
  });

  assert.equal(chunked.status, 201);
  assert.deepEqual(bulkSizes, [500, 1]);
  assert.equal(chunked.data.conductores.processed, 501);
  assert.equal(tooLarge.status, 400);
  assert.match(tooLarge.data.error, /maximo de 10000/i);
});

test('rechaza placa invalida y anio invalido antes de persistir vehiculos', async () => {
  const { token } = useAuthenticatedUser();
  let findOneCalls = 0;
  models.Vehiculo.findOne = async () => {
    findOneCalls += 1;
    return null;
  };

  const invalidPlate = await request('/api/vehiculos', {
    method: 'POST',
    token,
    body: validVehiclePayload({ placa: 'AB-1234' }),
  });
  const invalidYear = await request('/api/vehiculos', {
    method: 'POST',
    token,
    body: validVehiclePayload({ anio: 1989 }),
  });

  assert.equal(invalidPlate.status, 400);
  assert.match(invalidPlate.data.error, /placa/i);
  assert.equal(invalidYear.status, 400);
  assert.match(invalidYear.data.error, /anio/i);
  assert.equal(findOneCalls, 0);
});

test('rechaza placa duplicada para el mismo usuario y permite consultar por ownerEmail', async () => {
  const { token, user } = useAuthenticatedUser();

  models.Vehiculo.findOne = async (query) => {
    assert.deepEqual(query, { placa: 'ABC123', ownerEmail: user.email });
    return { _id: 'existing-vehicle' };
  };

  const result = await request('/api/vehiculos', {
    method: 'POST',
    token,
    body: validVehiclePayload({ placa: 'ABC123' }),
  });

  assert.equal(result.status, 400);
  assert.equal(result.data.error, 'Ya existe un vehiculo con esta placa.');
});

test('permite la misma placa para otro usuario porque el indice es ownerEmail mas placa', async () => {
  const userA = useAuthenticatedUser({ email: 'fleet.a@example.com' });
  let savedOwner;

  models.Vehiculo.findOne = async (query) => {
    assert.deepEqual(query, { placa: 'ABC123', ownerEmail: userA.user.email });
    return null;
  };
  models.Vehiculo.prototype.save = async function saveVehicleStub() {
    savedOwner = this.ownerEmail;
    return this;
  };

  const result = await request('/api/vehiculos', {
    method: 'POST',
    token: userA.token,
    body: validVehiclePayload({ placa: 'ABC123' }),
  });

  assert.equal(result.status, 201);
  assert.equal(savedOwner, userA.user.email);
});

test('lista solo vehiculos del usuario autenticado', async () => {
  const { token, user } = useAuthenticatedUser();
  let receivedQuery;

  models.Vehiculo.find = async (query) => {
    receivedQuery = query;
    return [{ _id: 'vehicle-a', placa: 'ABC123', ownerEmail: user.email }];
  };

  const result = await request('/api/vehiculos', { token });

  assert.equal(result.status, 200);
  assert.deepEqual(receivedQuery, { ownerEmail: user.email });
  assert.equal(result.data.length, 1);
});

test('edita vehiculo propio e impide editar vehiculo de otro usuario', async () => {
  const { token, user } = useAuthenticatedUser();
  const existingVehicle = {
    _id: '507f1f77bcf86cd799439011',
    ownerEmail: user.email,
    save: async function saveVehicleStub() {
      return this;
    },
  };
  const queries = [];

  models.Vehiculo.findOne = async (query) => {
    queries.push(query);
    if (query._id === existingVehicle._id) return existingVehicle;
    return null;
  };

  const updated = await request(`/api/vehiculos/${existingVehicle._id}`, {
    method: 'PUT',
    token,
    body: validVehiclePayload({ placa: 'def456', marca: 'Chevrolet' }),
  });
  const blocked = await request('/api/vehiculos/507f1f77bcf86cd799439012', {
    method: 'PUT',
    token,
    body: validVehiclePayload({ placa: 'GHI789' }),
  });

  assert.equal(updated.status, 200);
  assert.equal(existingVehicle.placa, 'DEF456');
  assert.equal(existingVehicle.marca, 'Chevrolet');
  assert.deepEqual(queries[0], { _id: existingVehicle._id, ownerEmail: user.email });
  assert.equal(blocked.status, 404);
});

test('borra vehiculo propio y elimina SOAT/RTM asociados del mismo ownerEmail', async () => {
  const { token, user } = useAuthenticatedUser();
  const vehicleId = '507f1f77bcf86cd799439011';
  const cascadeDeletes = [];

  models.Vehiculo.findOneAndDelete = async (query) => {
    assert.deepEqual(query, { _id: vehicleId, ownerEmail: user.email });
    return { _id: vehicleId, ownerEmail: user.email };
  };
  models.Soat.deleteMany = async (query) => {
    cascadeDeletes.push({ model: 'soat', query });
    return { deletedCount: 1 };
  };
  models.Rtm.deleteMany = async (query) => {
    cascadeDeletes.push({ model: 'rtm', query });
    return { deletedCount: 1 };
  };

  const result = await request(`/api/vehiculos/${vehicleId}`, {
    method: 'DELETE',
    token,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(cascadeDeletes, [
    { model: 'soat', query: { vehiculoId: vehicleId, ownerEmail: user.email } },
    { model: 'rtm', query: { vehiculoId: vehicleId, ownerEmail: user.email } },
  ]);
});

test('conductores crean, listan y eliminan con ownerEmail; al borrar limpian asignaciones', async () => {
  const { token, user } = useAuthenticatedUser();
  const conductorId = '507f1f77bcf86cd799439013';
  let savedConductor;
  let listQuery;
  let cleanupQuery;

  models.Conductor.findOne = async () => null;
  models.Conductor.prototype.save = async function saveConductorStub() {
    savedConductor = this;
    return this;
  };
  models.Conductor.find = async (query) => {
    listQuery = query;
    return [{ _id: conductorId, ownerEmail: user.email }];
  };
  models.Conductor.findOneAndDelete = async (query) => ({ _id: query._id, ownerEmail: query.ownerEmail });
  models.Vehiculo.updateMany = async (query, update) => {
    cleanupQuery = { query, update };
    return { modifiedCount: 1 };
  };

  const created = await request('/api/conductores', {
    method: 'POST',
    token,
    body: {
      nombre: 'Laura Perez',
      documento: '1234567890',
      telefono: '3001234567',
      categoria: 'C2',
      fechaVencimiento: '2027-01-01',
    },
  });
  const listed = await request('/api/conductores', { token });
  const deleted = await request(`/api/conductores/${conductorId}`, { method: 'DELETE', token });

  assert.equal(created.status, 201);
  assert.equal(savedConductor.ownerEmail, user.email);
  assert.equal(listed.status, 200);
  assert.deepEqual(listQuery, { ownerEmail: user.email });
  assert.equal(deleted.status, 200);
  assert.deepEqual(cleanupQuery, {
    query: { conductorId, ownerEmail: user.email },
    update: { conductorId: null },
  });
});

test('SOAT valida vehiculo propio, normaliza placa y reemplaza el SOAT previo del vehiculo', async () => {
  const { token, user } = useAuthenticatedUser();
  const vehicleId = '507f1f77bcf86cd799439011';
  let savedSoat;
  let deleteQuery;

  models.Vehiculo.findOne = async (query) => {
    assert.deepEqual(query, { _id: vehicleId, ownerEmail: user.email });
    return { _id: vehicleId, placa: 'abc123', ownerEmail: user.email };
  };
  models.Soat.deleteMany = async (query) => {
    deleteQuery = query;
    return { deletedCount: 1 };
  };
  models.Soat.prototype.save = async function saveSoatStub() {
    savedSoat = this;
    return this;
  };

  const result = await request('/api/soats', {
    method: 'POST',
    token,
    body: validSoatPayload(vehicleId),
  });

  assert.equal(result.status, 201);
  assert.deepEqual(deleteQuery, { vehiculoId: vehicleId, ownerEmail: user.email });
  assert.equal(savedSoat.ownerEmail, user.email);
  assert.equal(savedSoat.placaVehiculo, 'ABC123');
  assert.equal(savedSoat.numeroPoliza, 'SOAT-001');
});

test('RTM valida vehiculo propio y rechaza vehiculo ajeno', async () => {
  const { token, user } = useAuthenticatedUser();
  const vehicleId = '507f1f77bcf86cd799439011';
  let savedRtm;

  models.Vehiculo.findOne = async (query) => {
    assert.deepEqual(query, { _id: vehicleId, ownerEmail: user.email });
    return null;
  };

  const blocked = await request('/api/rtms', {
    method: 'POST',
    token,
    body: validRtmPayload(vehicleId),
  });

  models.Vehiculo.findOne = async () => ({ _id: vehicleId, placa: 'xyz987', ownerEmail: user.email });
  models.Rtm.deleteMany = async () => ({ deletedCount: 1 });
  models.Rtm.prototype.save = async function saveRtmStub() {
    savedRtm = this;
    return this;
  };

  const created = await request('/api/rtms', {
    method: 'POST',
    token,
    body: validRtmPayload(vehicleId),
  });

  assert.equal(blocked.status, 400);
  assert.match(blocked.data.error, /no existe|no pertenece/i);
  assert.equal(created.status, 201);
  assert.equal(savedRtm.ownerEmail, user.email);
  assert.equal(savedRtm.placaVehiculo, 'XYZ987');
});

test('validaciones se crean, listan y editan notas solo por ownerEmail', async () => {
  const { token, user } = useAuthenticatedUser();
  const validationId = '507f1f77bcf86cd799439014';
  let savedValidation;
  let listQuery;

  models.ValidationHistory.prototype.save = async function saveValidationStub() {
    savedValidation = this;
    return this;
  };
  models.ValidationHistory.find = (query) => {
    listQuery = query;
    return {
      sort: async (sort) => [{ _id: validationId, ownerEmail: user.email, sort }],
    };
  };
  models.ValidationHistory.findOne = async (query) => ({
    _id: query._id,
    ownerEmail: query.ownerEmail,
    notas: '',
    save: async function saveNotesStub() {
      return this;
    },
  });

  const created = await request('/api/validaciones', {
    method: 'POST',
    token,
    body: {
      placa: ' abc123 ',
      resultadoRUNT: { estado: 'Activo' },
      notas: 'Sin novedad',
    },
  });
  const listed = await request('/api/validaciones', { token });
  const edited = await request(`/api/validaciones/${validationId}/notas`, {
    method: 'PUT',
    token,
    body: { notas: 'Revisado' },
  });

  assert.equal(created.status, 201);
  assert.equal(savedValidation.placa, 'ABC123');
  assert.equal(savedValidation.ownerEmail, user.email);
  assert.equal(listed.status, 200);
  assert.deepEqual(listQuery, { ownerEmail: user.email });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.notas, 'Revisado');
});
