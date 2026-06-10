const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const backendDir = path.resolve(__dirname, '..');
const repoRootDir = path.resolve(backendDir, '..');
const backendEnvPath = path.join(backendDir, '.env');
const backendEnvExamplePath = path.join(backendDir, '.env.example');
const rootEnvPath = path.join(repoRootDir, '.env');
const webEnvPaths = [
  path.join(repoRootDir, 'apps', 'web', '.env.local'),
  path.join(repoRootDir, 'apps', 'web', '.env'),
];

const labelForPath = (filePath) => {
  if (filePath === backendEnvPath) return 'backend/.env';
  if (filePath === backendEnvExamplePath) return 'backend/.env.example';
  if (filePath === rootEnvPath) return '.env';
  return path.basename(filePath);
};

const isBlankOrPlaceholder = (value) => {
  const normalized = String(value ?? '').trim();
  return (
    !normalized ||
    normalized === 'your-google-oauth-client-id' ||
    normalized.includes('<') ||
    normalized.includes('>')
  );
};

const loadEnvFile = (filePath, { override, protectedKeys = new Set() }) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  if (override) {
    dotenv.config({ path: filePath, override: true });
    return labelForPath(filePath);
  }

  const parsed = dotenv.parse(fs.readFileSync(filePath));
  Object.entries(parsed).forEach(([key, value]) => {
    const hasProtectedValue = protectedKeys.has(key) && !isBlankOrPlaceholder(process.env[key]);
    if (!hasProtectedValue) {
      process.env[key] = value;
    }
  });

  return labelForPath(filePath);
};

const loadFrontendGoogleClientId = () => {
  if (process.env.NODE_ENV === 'production' || !isBlankOrPlaceholder(process.env.GOOGLE_CLIENT_ID)) {
    return null;
  }

  for (const webEnvPath of webEnvPaths) {
    if (!fs.existsSync(webEnvPath)) continue;

    const parsed = dotenv.parse(fs.readFileSync(webEnvPath));
    const googleClientId = String(parsed.GOOGLE_CLIENT_ID || parsed.VITE_GOOGLE_CLIENT_ID || '').trim();

    if (!isBlankOrPlaceholder(googleClientId)) {
      process.env.GOOGLE_CLIENT_ID = googleClientId;
      return `${path.relative(repoRootDir, webEnvPath).replace(/\\/g, '/')} (GOOGLE_CLIENT_ID publico)`;
    }
  }

  return null;
};

const loadProjectEnv = ({ explicitEnvFile = null } = {}) => {
  if (process.env.SKIP_PROJECT_ENV_LOAD === 'true') {
    return [];
  }

  const loadedFrom = [];

  if (explicitEnvFile) {
    const envPath = path.resolve(backendDir, explicitEnvFile);
    const label = loadEnvFile(envPath, { override: true });
    return label ? [label] : [];
  }

  const processKeys = new Set(Object.keys(process.env));

  const rootLabel = loadEnvFile(rootEnvPath, { override: false, protectedKeys: processKeys });
  if (rootLabel) {
    loadedFrom.push(rootLabel);
  }

  const backendLabel = loadEnvFile(backendEnvPath, { override: false, protectedKeys: processKeys });
  if (backendLabel) {
    loadedFrom.push(backendLabel);
  }

  if (loadedFrom.length === 0 && process.env.NODE_ENV !== 'production') {
    const fallbackLabel = loadEnvFile(backendEnvExamplePath, { override: false, protectedKeys: processKeys });
    if (fallbackLabel) {
      loadedFrom.push(fallbackLabel);
    }
  }

  const frontendGoogleLabel = loadFrontendGoogleClientId();
  if (frontendGoogleLabel) {
    loadedFrom.push(frontendGoogleLabel);
  }

  return loadedFrom;
};

module.exports = {
  backendDir,
  backendEnvExamplePath,
  backendEnvPath,
  rootEnvPath,
  loadProjectEnv,
};
