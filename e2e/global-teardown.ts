import { execSync } from 'node:child_process';

// Safety net: stop any lock-tracked background preview server so later runs
// never reuse a stale build. Never fails the suite.
export default function globalTeardown(): void {
  try {
    execSync('npx astro preview stop', { stdio: 'ignore', timeout: 10_000 });
  } catch {
    // nothing running, or astro unavailable: ignore
  }
}
