const { execFileSync } = require('child_process');

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const isTrackedSecret = (filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop();

  if (fileName === 'ANEXO_CREDENCIALES_PRIVADO.md') {
    return true;
  }

  if (!fileName.startsWith('.env')) {
    return false;
  }

  return fileName !== '.env.example' && normalized !== 'apps/web/.env.local.example';
};

const violations = trackedFiles.filter(isTrackedSecret);

if (violations.length > 0) {
  console.error('Tracked secret-like files found:');
  violations.forEach((filePath) => console.error(`- ${filePath}`));
  process.exit(1);
}

console.log('No tracked secret-like files found.');
