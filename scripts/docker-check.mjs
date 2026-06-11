import { spawnSync } from 'node:child_process';

const run = (command, args) =>
  spawnSync(command, args, {
    encoding: 'utf8',
  });

const dockerVersion = run('docker', ['--version']);

if (dockerVersion.status !== 0) {
  console.error('[docker-check] Docker no esta disponible en esta terminal.');
  console.error('[docker-check] Abre Docker Desktop y verifica que el comando docker este en el PATH.');
  process.exit(1);
}

console.log(`[docker-check] ${dockerVersion.stdout.trim()}`);

const composeVersion = run('docker', ['compose', 'version']);

if (composeVersion.status !== 0) {
  console.error('[docker-check] Docker Compose no esta disponible.');
  console.error('[docker-check] Actualiza Docker Desktop o instala el plugin docker compose.');
  process.exit(1);
}

console.log(`[docker-check] ${composeVersion.stdout.trim()}`);

const composeConfig = spawnSync('docker', ['compose', 'config'], {
  stdio: 'inherit',
});

if (composeConfig.status !== 0) {
  console.error('[docker-check] docker compose config fallo. Revisa variables requeridas en .env.');
  process.exit(composeConfig.status ?? 1);
}

console.log('[docker-check] Configuracion Docker Compose valida.');
