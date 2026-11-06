# Design Token Flow

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://commitizen.github.io/cz-cli/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)](https://makeapullrequest.com)
![issues](https://img.shields.io/github/issues/phun-ky/site-design-token-flow)
![GitHub Repo stars](https://img.shields.io/github/stars/phun-ky/site-design-token-flow)
[![build](https://github.com/phun-ky/site-design-token-flow/actions/workflows/check.yml/badge.svg)](https://github.com/phun-ky/site-design-token-flow/actions/workflows/check.yml)

A site that shows design tokens and how they relate: every token is drawn as a "pill", and lines connect each token to the tokens it references.

**Live:** <https://phun-ky.net/site-design-token-flow/>, deployed to GitHub Pages on every merge to `main`.

> [!IMPORTANT]
> The npm package `@phun-ky/design-token-flow` is deprecated and will not be updated. Its only usable feature, creating design token elements, will be published as its own package.

## Development

```shell
npm i
npm run dev       # http://localhost:5173: flow view, and the pill playground at /playground
npm test
npm run build     # the site, in dist/
npm run preview   # serve dist/
npm run test:e2e  # build, then check the site in Google Chrome (see below)
```

`npm run test:e2e` serves `dist/` like GitHub Pages (`e2e/serve.mjs`, gzipped, under `/site-design-token-flow/`) and runs the Playwright checks in `e2e/` with the installed Google Chrome: requests only to the site's own origin and no console errors, no horizontal scroll at 390, 768 and 1440 px in both themes, every link and referenced file resolves, zoom, pan, fit, the theme switch and the playground work, and each page stays within its performance budget on a throttled phone (`e2e/performance.spec.ts`). CI runs them as "Website checks" and keeps the traces of a failed check.

## Structure

- `site/`: the site's pages. `index.html` is the flow view, `playground.html` lets you edit token JSON and inspect the rendered pills.
- `src/main.ts`: the flow view. It lays tokens out in columns and draws the lines with [`@phun-ky/arclace`](https://www.npmjs.com/package/@phun-ky/arclace).
- `src/assets/data/design-tokens.tokens.json`: the tokens shown, in the [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) format.
- `src/assets/shiki/`: the code themes of the other phun-ky docs sites, used by the playground's syntax highlighting.
- `site/public/`: copied to the build as they are: the favicon (`favicon.svg`, with `favicon-32.png` and `apple-touch-icon.png` rendered from it), the social card `og-image.png` (1200 by 630, rendered from the site's own pills in a headless browser), and `404.html` with `404.css`, which GitHub Pages serves for any missing path, so its URLs are absolute.
- `site/public/fonts/`: the IBM Plex Sans files the font tokens describe ([SIL Open Font License 1.1](site/public/fonts/LICENSE.txt)). Both pages load them from the tokens, so each font pill is shown in its own face.
- `src/tokens/`: parses token files and renders pills. It is self-contained and will be extracted into its own package; see [its README](src/tokens/README.md).

## Contributors

[Stefano Tirloni](http://www.stedesign.com/)
