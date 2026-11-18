import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  globalTeardown: './e2e/global-teardown.ts',
  webServer: {
    // --ignore-lock keeps astro preview in the foreground (Astro 7 auto-daemonizes
    // when it detects an AI agent), so Playwright owns and stops the process.
    command: 'npm run build && npm run preview -- --port 4321 --ignore-lock',
    url: 'http://localhost:4321',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  // Motion off by default so layout specs never measure GSAP transforms;
  // e2e/motion.spec.ts opts back in with reducedMotion: 'no-preference'.
  use: { baseURL: 'http://localhost:4321', reducedMotion: 'reduce' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
