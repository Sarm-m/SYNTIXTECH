import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const currentPid = process.pid;
const isWindows = process.platform === 'win32';

const commandLooksLikeProjectDev = (command = '') =>
  /npm run dev|npm start|concurrently|vite|node server\.js/.test(command);

const isInsideRepo = (cwd = '') => {
  const normalizedCwd = path.resolve(cwd);
  return normalizedCwd === repoRoot || normalizedCwd.startsWith(`${repoRoot}${path.sep}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const killPid = (pid, signal) => {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
};

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const getPosixProcesses = () => {
  const result = spawnSync('ps', ['-eo', 'pid=,ppid=,args='], { encoding: 'utf8' });
  if (result.status !== 0) return [];

  return result.stdout
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
      if (!match) return null;

      const pid = Number(match[1]);
      const ppid = Number(match[2]);
      const command = match[3];
      let cwd = '';

      try {
        cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
      } catch {
        cwd = '';
      }

      return { pid, ppid, command, cwd };
    })
    .filter(Boolean);
};

const getWindowsProcesses = () => {
  const script = [
    'Get-CimInstance Win32_Process',
    '| Select-Object ProcessId,ParentProcessId,CommandLine',
    '| ConvertTo-Json -Compress',
  ].join(' ');

  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', script], { encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout.trim()) return [];

  try {
    const parsed = JSON.parse(result.stdout);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows
      .map((row) => ({
        pid: Number(row.ProcessId),
        ppid: Number(row.ParentProcessId),
        command: String(row.CommandLine || ''),
        cwd: '',
      }))
      .filter((row) => Number.isFinite(row.pid));
  } catch {
    return [];
  }
};

const processes = isWindows ? getWindowsProcesses() : getPosixProcesses();
const byParent = new Map();

for (const proc of processes) {
  if (!byParent.has(proc.ppid)) byParent.set(proc.ppid, []);
  byParent.get(proc.ppid).push(proc);
}

const initialMatches = processes.filter((proc) => {
  if (proc.pid === currentPid) return false;
  if (!commandLooksLikeProjectDev(proc.command)) return false;

  if (isWindows) {
    return proc.command.includes(repoRoot) || proc.command.includes('SYNTIXTECH');
  }

  return proc.cwd && isInsideRepo(proc.cwd);
});

const selected = new Map();
const visit = (proc) => {
  if (!proc || proc.pid === currentPid || selected.has(proc.pid)) return;
  selected.set(proc.pid, proc);
  for (const child of byParent.get(proc.pid) || []) {
    visit(child);
  }
};

for (const proc of initialMatches) {
  visit(proc);
}

const targets = [...selected.values()].sort((a, b) => b.pid - a.pid);

if (targets.length === 0) {
  console.log('[local-stop] No hay procesos npm/vite/backend locales del proyecto para cerrar.');
  process.exit(0);
}

console.log(`[local-stop] Cerrando ${targets.length} proceso(s) locales del proyecto...`);
for (const proc of targets) {
  console.log(`[local-stop] SIGTERM ${proc.pid} ${proc.command}`);
  killPid(proc.pid, 'SIGTERM');
}

await sleep(800);

for (const proc of targets) {
  if (isAlive(proc.pid)) {
    console.log(`[local-stop] SIGKILL ${proc.pid}`);
    killPid(proc.pid, 'SIGKILL');
  }
}
