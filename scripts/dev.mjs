import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const checkOnly = process.argv.includes('--check');

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return env;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
};

const getLocalMongoUri = () => {
  const rootEnv = parseEnvFile(path.join(repoRoot, '.env'));
  const backendEnv = parseEnvFile(path.join(repoRoot, 'backend', '.env'));
  return process.env.MONGO_URI || backendEnv.MONGO_URI || rootEnv.MONGO_URI || '';
};

const shouldUseLocalMongo = () => {
  const mongoUri = getLocalMongoUri().toLowerCase();
  return mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
};

const canConnect = (port, host = '127.0.0.1', timeoutMs = 700) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });

const waitForPort = async (port, host = '127.0.0.1', attempts = 20) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await canConnect(port, host, 700)) return true;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  return false;
};

const startMongoIfUseful = async () => {
  if (!shouldUseLocalMongo()) {
    console.log('[dev] Mongo local no parece necesario; se usara la configuracion del backend.');
    return;
  }

  if (await canConnect(27017)) {
    console.log('[dev] MongoDB ya esta disponible en localhost:27017.');
    return;
  }

  if (checkOnly) {
    console.warn('[dev] MongoDB local no responde en localhost:27017.');
    console.warn('[dev] En ejecucion normal intentare levantarlo con Docker Compose si Docker esta disponible.');
    return;
  }

  const dockerCheck = spawnSync('docker', ['--version'], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: isWindows,
  });

  if (dockerCheck.status !== 0) {
    console.warn('[dev] MongoDB no responde en localhost:27017 y Docker no esta disponible.');
    console.warn('[dev] Abre MongoDB manualmente o usa Docker Desktop antes de iniciar sesion.');
    return;
  }

  console.log('[dev] Levantando MongoDB con Docker Compose...');
  const composeResult = spawnSync('docker', ['compose', 'up', '-d', 'mongodb'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: isWindows,
  });

  if (composeResult.status !== 0) {
    console.warn('[dev] No se pudo levantar MongoDB con Docker Compose. Continuo con backend/frontend.');
    return;
  }

  if (await waitForPort(27017)) {
    console.log('[dev] MongoDB listo en localhost:27017.');
  } else {
    console.warn('[dev] MongoDB aun no responde en localhost:27017; el backend puede tardar o fallar.');
  }
};

const runWebDev = () => {
  console.log('[dev] Iniciando backend + frontend en una sola terminal...');
  console.log('[dev] Frontend: http://localhost:3000');
  console.log('[dev] Backend:  http://localhost:5000');

  const child = spawn(npmCommand, ['--prefix', 'apps/web', 'run', 'dev'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: isWindows,
  });

  const stop = () => {
    if (!child.killed) child.kill('SIGINT');
  };

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
};

await startMongoIfUseful();

if (checkOnly) {
  console.log('[dev] Check listo. Usa npm run dev para iniciar todo.');
} else {
  runWebDev();
}
