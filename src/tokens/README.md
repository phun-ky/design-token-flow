# Design token pills

Parses [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) design token files and renders each token as an HTML "pill".

This folder is meant to become its own npm package. Until then, it lives here so it can be refined against the Design Token Flow site.

## Boundary rules

- The app imports this folder only through [`index.ts`](./index.ts), plus the stylesheet in [`styles/`](./styles).
- Nothing in here imports app code (flow view, Arclace lines, `site/` pages, app data).
- App-only styling goes in `src/styles/`, not here.

## Public API

| Export                                                    | What it does                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `flattenTokens(doc)`                                      | Flattens a token document into tokens with resolved `$type`, value, aliases and relations |
| `renderDesignToken(token, options?)`                      | HTML string for one pill                                                                  |
| `createDesignTokenElement(token, options?)`               | The same pill as an `HTMLElement`                                                         |
| `getDesignTokenKind(token)`                               | Which pill variant a token renders as                                                     |
| `toCssValue(token)` and `colorToCss`, `dimensionToCss`, … | Token value to CSS value                                                                  |
| `DTF_EXTENSION_KEY`, `getExtension(token)`                | This tool's `$extensions` data                                                            |
| Types                                                     | `DTCGDocument`, `FlatDesignToken`, every `$type` value shape                              |

Styles: [`styles/design-token.css`](./styles/design-token.css), themed with `--dtf-*` custom properties and `:root.theme--light`.

## Extracting into a package

1. Create the new repo from this folder: `index.ts`, `types/`, `utils/` (with `__tests__/`) and `styles/`.
2. Decide on the package name. If it changes, consider renaming `DTF_EXTENSION_KEY` (`net.phun-ky.design-token-flow`) and the `--dtf-` prefix, and keep reading the old key for existing token files.
3. Build it with Vite library mode (config below), and build the CSS from the Stylus file.
4. Publish, then replace `src/tokens` in this repo with the package.

This library config worked here before the repo became a site:

```ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts'; // also needs @microsoft/api-extractor for bundleTypes

export default defineConfig({
  build: {
    sourcemap: true,
    minify: true,
    lib: {
      entry: 'index.ts',
      name: 'DesignTokenPills',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.umd.cjs')
    },
    rolldownOptions: {
      // `banner` is stripped by the minifier in the UMD build, `postBanner` is added after it
      output: { postBanner: '/** license header */' }
    }
  },
  plugins: [dts({ exclude: ['**/__tests__/**'], bundleTypes: true })]
});
```

Things learned along the way:

- Don't set `output.exports: 'named'` on an entry without exports: the UMD wrapper then references an undefined `exports` and crashes on load.
- Vite keeps whitespace in ES library output on purpose, so consumers can tree-shake it. Expect it to be bigger than the UMD file.
