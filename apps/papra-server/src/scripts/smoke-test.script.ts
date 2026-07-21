import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { runScript } from './commons/run-script';

const SMOKE_TEST_PORT = 14522;
const READINESS_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 250;
const SHUTDOWN_GRACE_MS = 5_000;
const PING_URL = `http://127.0.0.1:${SMOKE_TEST_PORT}/api/ping`;

// Thrown when the server is not yet accepting connections; the only case worth retrying.
class ServerNotReadyYetError extends Error {}

async function pingServer(): Promise<void> {
  let response: Response;

  try {
    response = await fetch(PING_URL);
  } catch (error) {
    // Connection refused/reset while the server is still booting: keep polling.
    throw new ServerNotReadyYetError('Server not accepting connections yet', { cause: error });
  }

  const body = (await response.json()) as { status: string } | undefined;

  if (response.status !== 200 || body?.status !== 'ok') {
    throw new Error(
      `Unexpected /api/ping response: status=${response.status} body=${JSON.stringify(body)}`,
    );
  }
}

async function waitForServerReady({ child }: { child: ChildProcess }): Promise<void> {
  const deadline = Date.now() + READINESS_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Server process exited early with code ${child.exitCode} before becoming ready`,
      );
    }

    try {
      await pingServer();
      return;
    } catch (error) {
      // Only transient connection errors are retried; parsing/HTTP/runtime errors surface immediately.
      if (!(error instanceof ServerNotReadyYetError)) {
        throw error;
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Server did not become ready within ${READINESS_TIMEOUT_MS}ms`);
}

// Terminate the child, escalating to SIGKILL if it does not exit within the grace period,
// so a stubborn process can never hang the CI job.
async function terminateServer({ child }: { child: ChildProcess }): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  const exited = once(child, 'exit');
  child.kill('SIGTERM');

  const timedOut = await Promise.race([
    exited.then(() => false),
    sleep(SHUTDOWN_GRACE_MS).then(() => true),
  ]);

  if (timedOut) {
    child.kill('SIGKILL');
    await exited;
  }
}

await runScript({ scriptName: 'smoke-test' }, async ({ logger }) => {
  const storageRoot = mkdtempSync(join(tmpdir(), 'papra-smoke-'));

  const child = spawn(process.execPath, ['dist/index.js'], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      AUTH_SECRET: 'smoke-test-secret-not-used-for-real-auth',
      PROCESS_MODE: 'web',
      PORT: String(SMOKE_TEST_PORT),
      DATABASE_URL: 'file::memory:',
      DOCUMENT_STORAGE_FILESYSTEM_ROOT: storageRoot,
    },
  });

  try {
    await waitForServerReady({ child });
    logger.info({ port: SMOKE_TEST_PORT }, 'Built server booted and /api/ping returned ok');
  } finally {
    await terminateServer({ child });
    rmSync(storageRoot, { recursive: true, force: true });
  }
});
