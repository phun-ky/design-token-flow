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
```

## Structure

- `site/`: the site's pages. `index.html` is the flow view, `playground.html` lets you edit token JSON and inspect the rendered pills.
- `src/main.ts`: the flow view. It lays tokens out in columns and draws the lines with [`@phun-ky/arclace`](https://www.npmjs.com/package/@phun-ky/arclace).
- `src/assets/data/design-tokens.tokens.json`: the tokens shown, in the [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) format.
- `site/public/fonts/`: the IBM Plex Sans files the font tokens describe ([SIL Open Font License 1.1](site/public/fonts/LICENSE.txt)). Both pages load them from the tokens, so each font pill is shown in its own face.
- `src/tokens/`: parses token files and renders pills. It is self-contained and will be extracted into its own package; see [its README](src/tokens/README.md).

## Contributors

[Stefano Tirloni](http://www.stedesign.com/)
