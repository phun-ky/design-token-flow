import { defineConfig } from 'vite';

import { fileURLToPath } from 'node:url';

const fromRoot = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

/**
 * Design Token Flow is a site: `npm run dev` serves the pages in ./dev,
 * `npm run build` builds them into ./dist.
 */
export default defineConfig({
  root: fromRoot('./dev'),
  // Relative asset URLs, so the build works from any sub path (and when wrapped in an app shell)
  base: './',
  build: {
    outDir: fromRoot('./dist'),
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: {
      input: {
        index: fromRoot('./dev/index.html'),
        playground: fromRoot('./dev/playground.html')
      }
    }
  }
});
