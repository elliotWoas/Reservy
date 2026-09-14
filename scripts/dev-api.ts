import { spawn, spawnSync } from 'child_process';
import net from 'net';

const prismaSchema = './packages/database/prisma/schema.prisma';
const prismaCli = './packages/database/node_modules/prisma/build/index.js';

async function readEnvFile(): Promise<Record<string, string>> {
  const envFile = Bun.file('.env');
  if (!(await envFile.exists())) {
    return {};
  }

  const env: Record<string, string> = {};
  const text = await envFile.text();

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function parseDatabaseTarget(databaseUrl: string): { host: string; port: number } {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname || 'localhost',
    port: Number(url.port || 5432),
  };
}

function canConnect(host: string, port: number, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForDatabase(host: string, port: number): Promise<boolean> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await canConnect(host, port, 1000)) {
      return true;
    }
    await Bun.sleep(1000);
  }

  return false;
}

function run(command: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function ensureDatabase(env: Record<string, string>) {
  const databaseUrl =
    process.env.DATABASE_URL ||
    env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5433/reservy?schema=public';
  const { host, port } = parseDatabaseTarget(databaseUrl);

  if (await canConnect(host, port)) {
    return;
  }

  console.log(`Database is not reachable at ${host}:${port}. Starting local services...`);
  run('docker', ['compose', 'up', '-d', 'postgres', 'redis']);

  if (!(await waitForDatabase(host, port))) {
    console.error(`Database did not become reachable at ${host}:${port}.`);
    process.exit(1);
  }
}

async function main() {
  const fileEnv = await readEnvFile();
  const env: Record<string, string> = { ...fileEnv };

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  await ensureDatabase(env);
  run('bun', ['run', prismaCli, 'db', 'push', `--schema=${prismaSchema}`], env);

  const api = spawn('bun', ['--filter', '@reservy/api', 'dev'], {
    stdio: 'inherit',
    env,
  });

  api.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
