import { defineConfig } from 'vite';

import { fileURLToPath } from 'node:url';

import { addSecurityMeta } from './src/build/security-meta';

const fromRoot = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

/**
 * Design Token Flow is a site: `npm run dev` serves the pages in ./site,
 * `npm run build` builds them into ./dist.
 */
export default defineConfig({
  root: fromRoot('./site'),
  // Relative asset URLs, so the build works from any sub path (and when wrapped in an app shell)
  base: './',
  plugins: [
    {
      // Content Security Policy and referrer policy as <meta>, since GitHub
      // Pages can't send headers; build only, Vite's dev styles would be blocked
      name: 'dtf-security-meta',
      apply: 'build',
      transformIndexHtml: { order: 'post', handler: addSecurityMeta }
    }
  ],
  build: {
    outDir: fromRoot('./dist'),
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: {
      input: {
        index: fromRoot('./site/index.html'),
        playground: fromRoot('./site/playground.html')
      }
    }
  }
});
