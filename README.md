# Design Token Flow

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://commitizen.github.io/cz-cli/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)](https://makeapullrequest.com)
![issues](https://img.shields.io/github/issues/phun-ky/site-design-token-flow)
![GitHub Repo stars](https://img.shields.io/github/stars/phun-ky/site-design-token-flow)
[![build](https://github.com/phun-ky/site-design-token-flow/actions/workflows/check.yml/badge.svg)](https://github.com/phun-ky/site-design-token-flow/actions/workflows/check.yml)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/16376/badge)](https://www.bestpractices.dev/projects/16376)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/phun-ky/site-design-token-flow/badge)](https://scorecard.dev/viewer/?uri=github.com/phun-ky/site-design-token-flow)

A site that shows design tokens and how they relate: every token is drawn as a "pill", and lines connect each token to the tokens it references.

**Live:** <https://phun-ky.net/site-design-token-flow/>, deployed to GitHub Pages on every merge to `main`.

> [!IMPORTANT]
> The npm package `@phun-ky/design-token-flow` is deprecated and will not be updated. Its only usable feature, creating design token elements, will be published as its own package.

## Using the site

Nothing to install: open the site in a current browser. Both pages work with a keyboard, and the switch in the header changes between the light and dark theme.

**[Token flow](https://phun-ky.net/site-design-token-flow/)** shows every token in the bundled token file as a pill. Base values are on the left, and each alias is joined by a line to the token it references, so you can follow a component token, such as a button background, down to the color it ends at.

- **Move around:** drag the canvas, or focus it (Tab, or the "Skip to content" link) and use the arrow keys; Shift and an arrow key moves further.
- **Zoom:** the mouse wheel or a trackpad zooms around the pointer, and the zoom buttons in the corner or the `+` and `-` keys zoom in steps. 100% is the flow fitted to the page width: `0` goes back to it, and `F` or "Fit to screen" fits the whole flow on the screen.

**[Playground](https://phun-ky.net/site-design-token-flow/playground)** renders single tokens as pills, so you can try your own.

1. Pick the tokens to start from: a showcase with one token of every `$type`, or the bundled token file.
2. Edit the [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) JSON on the left. The pills update as you type; a value that doesn't match its `$type` is refused, with an error naming the token and the field.
3. Filter the pills by name or `$type`, and select a pill to see its token, resolved value, the tokens it references and the HTML that renders it, which you can copy.

What you type in the playground stays in your browser; the [security policy](SECURITY.md#security-expectations) lists what the site stores and where.

## Development

```shell
npm i
npm run dev       # http://localhost:5173: flow view, and the pill playground at /playground
npm test
npm run build     # the site, in dist/
npm run preview   # serve dist/
npm run test:e2e  # build, then check the site in Google Chrome (see below)
```

`npm run test:e2e` serves `dist/` like GitHub Pages (`e2e/serve.mjs`, gzipped, under `/site-design-token-flow/`) and runs the Playwright checks in `e2e/` with the installed Google Chrome: requests only to the site's own origin and no console errors, no horizontal scroll at 390, 768 and 1440 px in both themes, no axe violations (WCAG 2.2 A and AA) on any page in either theme, every link and referenced file resolves, zoom, pan, fit, the theme switch and the playground work, and each page stays within its performance budget on a throttled phone (`e2e/performance.spec.ts`). CI runs them as "Website checks" and keeps the traces of a failed check.

## Structure

- `site/`: the site's pages. `index.html` is the flow view, `playground.html` lets you edit token JSON and inspect the rendered pills.
- `src/main.ts`: the flow view. It lays tokens out in columns and draws the lines with [`@phun-ky/arclace`](https://www.npmjs.com/package/@phun-ky/arclace).
- `src/assets/data/design-tokens.tokens.json`: the tokens shown, in the [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) format.
- `src/assets/shiki/`: the code themes of the other phun-ky docs sites, used by the playground's syntax highlighting.
- `site/public/`: copied to the build as they are: the favicon (`favicon.svg`, with `favicon-32.png` and `apple-touch-icon.png` rendered from it), the social card `og-image.png` (1200 by 630, rendered from the site's own pills in a headless browser), and `404.html` with `404.css`, which GitHub Pages serves for any missing path, so its URLs are absolute.
- `site/public/fonts/`: the IBM Plex Sans files the font tokens describe ([SIL Open Font License 1.1](site/public/fonts/LICENSE.txt)). Both pages load them from the tokens, so each font pill is shown in its own face.
- `src/tokens/`: parses token files and renders pills. It is self-contained and will be extracted into its own package; see [its README](src/tokens/README.md).

## Contributing

See the [contributing guide](CONTRIBUTING.md) for how to report bugs, suggest changes and work on the code, [governance](GOVERNANCE.md) for how decisions are made, and the [roadmap](ROADMAP.md) for what's planned. Report security problems privately, as the [security policy](SECURITY.md) describes.

## Contributors

[Stefano Tirloni](http://www.stedesign.com/)
