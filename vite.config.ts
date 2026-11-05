import { defineConfig } from 'vite';

import { fileURLToPath } from 'node:url';

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
