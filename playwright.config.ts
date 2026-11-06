import { defineConfig } from '@playwright/test';

const PORT = 4173;

/**
 * End-to-end checks of the built site (run `npm run build` first, or
 * `npm run test:e2e`), served like GitHub Pages by e2e/serve.mjs. Uses the
 * installed Google Chrome, which GitHub's Ubuntu runners have too.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/site-design-token-flow/`,
    channel: 'chrome',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node e2e/serve.mjs',
    url: `http://127.0.0.1:${PORT}/site-design-token-flow/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) }
  }
});
