# Assurance Case

Why the [security expectations](SECURITY.md#security-expectations) of Design
Token Flow hold, what they rest on, and where they don't hold yet. It is kept
short because the site is small: two static pages, a token file, two runtime
libraries, and a pipeline that builds and deploys them to GitHub Pages.

## What is being protected

- **Visitors and their browsers:** the site must show design tokens and do
  nothing else: run no code but its own, load nothing from other hosts, send
  nothing anywhere, and keep what a visitor types in the playground in their own
  browser.
- **The deployed site:** what GitHub Pages serves must be exactly what the
  Deploy workflow built from a commit on `main` that passed the checks.
- **The repository and its pipeline:** the source, the workflows, and the
  tokens that deploy the site.

## Threat model

| Threat                                            | Where                                                         | How it is countered                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script or markup injected through a token         | Token names, values, descriptions, the playground's prefix    | Every string from a token is escaped for HTML before it is rendered, in the pills and the playground's details. The Content Security Policy allows only the site's own scripts and one inline script by its hash, so injected markup still couldn't run a script. No `eval`, `new Function` or loading of code                                                                  |
| CSS injected through a token value                | Values rendered as `style` attributes, such as swatch colours | Every value is checked against its `$type` as DTCG 2025.10 defines it before it is shown: numbers, units, hex colours, colour components in range and keywords from the spec's lists; anything else refuses the whole file with an error. Font names, the only free text, are escaped for CSS                                                                                   |
| Tracking or loading from other hosts              | Scripts, styles, fonts, images, connections                   | No analytics and no third-party content. The Content Security Policy blocks every other origin and all connections, and the Website checks in CI fail on any request to another origin                                                                                                                                                                                          |
| A tampered or substituted deploy                  | GitHub Pages                                                  | Only the Deploy workflow deploys, and only `main`: after the Checks workflow passed on it, if `main` is still the commit that passed, or when the maintainer runs it by hand. The build is repeatable: a local build of a commit gives byte for byte the files that are live. HTTPS is enforced                                                                                 |
| A malicious or vulnerable dependency              | Runtime and development dependencies, Actions, vendored fonts | Two runtime libraries, discussed in an issue before they are added. Dependency review blocks pull requests that add a high or critical advisory; Dependabot proposes updates weekly, after a 14-day cooldown; Actions are pinned to commit SHAs. The vendored fonts were checked against the npm registry's integrity hashes and are copied, so their install script never runs |
| A malicious change to the source                  | Pull requests                                                 | Pull requests only, with required checks (lint, types, tests, the build, dependency review, CodeQL, the DCO) on `main`; no force pushes or deletion of `main`                                                                                                                                                                                                                   |
| Abuse of CI credentials                           | Workflows                                                     | Read-only default permissions in every workflow, write only per job; pull requests from forks get no secrets; the labeler runs on `pull_request_target` but never checks out or runs pull request code; no untrusted value is interpolated into a script; secret scanning with push protection                                                                                  |
| Saved playground data that has been tampered with | `localStorage`                                                | The saved JSON is parsed, validated and escaped like anything typed into the editor; the saved theme is only compared with `light`                                                                                                                                                                                                                                              |

## Trust boundaries

1. **Visitor to the page:** the playground's JSON, prefix and filter come from
   the visitor and stay in their browser. They are parsed with `JSON.parse`,
   validated, escaped and rendered under the Content Security Policy, and never
   sent anywhere.
2. **Token files to the page:** the bundled token file and the playground's
   showcase are part of the repository, and pass the same validation as the
   visitor's JSON; a unit test checks both.
3. **Repository to GitHub Pages:** only the Deploy workflow can deploy, and
   only `main`, with a short-lived token for that job only. It runs when the
   checks passed on `main`, or when the maintainer starts it.
4. **GitHub Pages to the visitor:** the site is served over HTTPS, and every
   page carries its Content Security Policy and referrer policy in `<meta>`
   tags.

## Secure design principles

- **Economy of mechanism:** static pages, no server, no accounts, no stored data
  but the visitor's own settings in their browser.
- **Fail-safe defaults:** a token file with a value that doesn't match its
  `$type` is refused as a whole, with an error, instead of being shown in part;
  the Content Security Policy starts from `default-src 'none'` and allows only
  what the site needs.
- **Least privilege:** CI tokens are read-only by default and write only where a
  job needs it; the deploy job alone can deploy.
- **Complete mediation:** every token goes through the same `flattenTokens()`
  validation, whether it comes from the repository or the playground.
- **Open design:** everything is public, including the pipeline and this
  document.
- **No dynamic code:** no `eval`, `new Function` or loading of code at run time.
- **Minimal dependencies:** two runtime libraries, and of Shiki only its core,
  one regular expression engine and two grammars.

## Common weaknesses countered

| Weakness                                           | Status                                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| CWE-79 cross-site scripting                        | Token strings are escaped for HTML; the Content Security Policy allows no inline or other-origin scripts                 |
| CWE-94 code injection                              | No dynamic code anywhere in the site                                                                                     |
| CWE-20 improper input validation                   | Every token value is checked against its `$type`, and token and group properties against the spec, before it is shown    |
| CWE-1321 prototype pollution                       | Lookup tables are read with `Object.hasOwn`, so a `$type` or key such as `__proto__` matches nothing                     |
| CWE-829 inclusion from an untrusted control sphere | Nothing is loaded from other hosts; dependencies come only from npm, locked; Actions are pinned to SHAs                  |
| CWE-494 download of code without integrity check   | npm verifies the integrity hashes in `package-lock.json`; the site is served only over HTTPS                             |
| CWE-359 exposure of private information            | No analytics, no requests to other hosts, and `no-referrer`; the playground's data stays in the visitor's `localStorage` |

## Known gaps

- **Response headers:** GitHub Pages can't send them, so the site can be framed
  by other sites and has no HSTS for the custom domain; see the
  [security expectations](SECURITY.md#security-expectations). The site has no
  account, form or action to trick a visitor into.
- **One maintainer:** pull requests by the maintainer get no second review, and
  access to the repository and the domain rests on one person; see
  [governance](GOVERNANCE.md#continuity).
- **Deploys are not signed:** the site is served over HTTPS from GitHub Pages
  and can be rebuilt byte for byte from its commit, but there is no signed
  provenance for a deploy.
