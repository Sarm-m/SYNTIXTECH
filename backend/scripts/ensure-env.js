const fs = require('fs');
const {
  DEFAULT_MONGO_DB_NAME,
  DEFAULT_MONGO_HOST,
  buildMongoUri,
  getMongoConfigErrors,
  redactMongoUri,
} = require('../config/mongo');
const {
  backendEnvPath,
  loadProjectEnv,
  rootEnvPath,
} = require('../config/load-env');

const hasRuntimeMongoEnv = Boolean(process.env.MONGO_URI || process.env.MONGO_USER || process.env.MONGO_PASSWORD);
if (!hasRuntimeMongoEnv && !fs.existsSync(backendEnvPath) && !fs.existsSync(rootEnvPath)) {
  console.error('[ENV] Falta configuracion. Crea backend/.env o .env en la raiz con MONGO_URI o MONGO_USER/MONGO_PASSWORD.');
  process.exit(1);
}

const loadedEnvSources = loadProjectEnv();
const mongoErrors = getMongoConfigErrors(process.env);
if (mongoErrors.length > 0) {
  console.error(
    `[ENV] Configuracion Mongo invalida. Usa MONGO_URI o define MONGO_USER/MONGO_PASSWORD para ${DEFAULT_MONGO_HOST}/${DEFAULT_MONGO_DB_NAME}.`
  );
  process.exit(1);
}

const mongoUri = buildMongoUri(process.env);
const sourceSummary = loadedEnvSources.length ? loadedEnvSources.join(', ') : 'process environment';
console.log(`[ENV] Configuracion validada desde ${sourceSummary}. MONGO_URI=${redactMongoUri(mongoUri)}`);

const googleClientId = String(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
if (!googleClientId || googleClientId === 'your-google-oauth-client-id') {
  console.warn('[ENV] Google Auth no tiene GOOGLE_CLIENT_ID configurado; el login con Google respondera 503.');
}
