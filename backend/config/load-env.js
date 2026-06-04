const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const backendDir = path.resolve(__dirname, '..');
const repoRootDir = path.resolve(backendDir, '..');
const backendEnvPath = path.join(backendDir, '.env');
const backendEnvExamplePath = path.join(backendDir, '.env.example');
const rootEnvPath = path.join(repoRootDir, '.env');

const labelForPath = (filePath) => {
  if (filePath === backendEnvPath) return 'backend/.env';
  if (filePath === backendEnvExamplePath) return 'backend/.env.example';
  if (filePath === rootEnvPath) return '.env';
  return path.basename(filePath);
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
    if (!protectedKeys.has(key)) {
      process.env[key] = value;
    }
  });

  return labelForPath(filePath);
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

  return loadedFrom;
};

module.exports = {
  backendDir,
  backendEnvExamplePath,
  backendEnvPath,
  rootEnvPath,
  loadProjectEnv,
};
