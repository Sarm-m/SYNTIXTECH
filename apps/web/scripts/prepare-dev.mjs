import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const webDir = process.cwd();
const backendDir = path.resolve(webDir, '../../backend');
const envPath = path.join(backendDir, '.env');
const webNodeModulesPath = path.join(webDir, 'node_modules');
const backendNodeModulesPath = path.join(backendDir, 'node_modules');
const backendPackageJsonPath = path.join(backendDir, 'package.json');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const getRollupNativePackage = () => {
  const { platform, arch } = process;

  if (platform === 'win32' && arch === 'x64') return '@rollup/rollup-win32-x64-msvc';
  if (platform === 'linux' && arch === 'x64') return '@rollup/rollup-linux-x64-gnu';
  if (platform === 'linux' && arch === 'arm64') return '@rollup/rollup-linux-arm64-gnu';
  if (platform === 'darwin' && arch === 'x64') return '@rollup/rollup-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return '@rollup/rollup-darwin-arm64';

  return null;
};

const installDependencies = (cwd, label) => {
  console.log(`[prepare-dev] Dependencias faltantes en ${label}. Instalando...`);
  const installResult = spawnSync(npmCommand, ['install'], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (installResult.status !== 0) {
    process.exit(installResult.status ?? 1);
  }

  console.log(`[prepare-dev] Dependencias de ${label} instaladas.`);
};

const shouldInstallWebDeps = () => {
  if (!fs.existsSync(webNodeModulesPath)) {
    return true;
  }

  const rollupNativePackage = getRollupNativePackage();
  if (!rollupNativePackage) {
    return false;
  }

  const rollupNativePath = path.join(webNodeModulesPath, ...rollupNativePackage.split('/'));
  if (!fs.existsSync(rollupNativePath)) {
    console.warn(
      `[prepare-dev] Falta ${rollupNativePackage}. Esto suele pasar al alternar entre Windows y WSL con el mismo node_modules.`
    );
    return true;
  }

  return false;
};

const shouldInstallBackendDeps = () => {
  if (!fs.existsSync(backendNodeModulesPath)) {
    return true;
  }

  if (!fs.existsSync(backendPackageJsonPath)) {
    console.error('[prepare-dev] Falta backend/package.json.');
    process.exit(1);
  }

  const backendPkg = JSON.parse(fs.readFileSync(backendPackageJsonPath, 'utf8'));
  const dependencyNames = Object.keys(backendPkg.dependencies || {});

  for (const depName of dependencyNames) {
    const depPath = path.join(backendNodeModulesPath, depName);
    if (!fs.existsSync(depPath)) {
      return true;
    }
  }

  return false;
};

if (!fs.existsSync(envPath)) {
  console.error('[prepare-dev] Falta backend/.env.');
  console.error('[prepare-dev] Crea backend/.env con las variables reales compartidas por el equipo.');
  console.error('[prepare-dev] No copies backend/.env.example sin reemplazar MONGO_URI, EMAIL_USER y EMAIL_PASS.');
  process.exit(1);
}

if (shouldInstallWebDeps()) {
  installDependencies(webDir, 'frontend');
}

if (shouldInstallBackendDeps()) {
  installDependencies(backendDir, 'backend');
}
