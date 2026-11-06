# Security Policy

Design Token Flow is a static website: the code in this repository is built into
plain HTML, CSS and JavaScript that show design tokens and how they relate.
There is no server, no account and no database. Every merge to `main` is
deployed to GitHub Pages, at <https://phun-ky.net/site-design-token-flow/>.

## Supported Versions

Only `main` is supported, and the live site built from it. There are no
releases or versions to upgrade: a fix is live as soon as it is merged and
deployed.

| Code                                          | Supported |
| --------------------------------------------- | --------- |
| `main`                                        | ✅        |
| Older commits, forks and copies hosted by you | ❌        |

The npm package `@phun-ky/design-token-flow` (0.1.0, from 2021) is deprecated
and not supported.

## Reporting a Vulnerability

Report vulnerabilities privately, either with GitHub's
[private vulnerability reporting](https://github.com/phun-ky/site-design-token-flow/security/advisories/new)
or by email to <security@phun-ky.net>. Please don't open a public issue for a
security problem.

## How Reports Are Handled

1. **Acknowledgement:** you'll get a reply within 7 days confirming the report
   was received.
2. **Assessment:** the maintainer reproduces the issue and judges its severity,
   and may ask you for details.
3. **Fix:** a fix is developed against a draft GitHub security advisory and
   merged. The aim is a fix within 30 days for serious issues, and sooner when
   the problem can be exploited through a link.
4. **Disclosure:** the advisory is published once the fix is merged and
   deployed. There is normally no CVE, since there is nothing for anyone else to
   update. Please keep the issue private until then.
5. **Credit:** reporters are credited in the advisory, unless they ask to stay
   anonymous.

## Security Expectations

What you can rely on:

- **No accounts and nothing stored on a server.** The site has no backend and
  makes no network requests of its own: it shows the token file it is built
  with.
- **Your settings stay in your browser.** The light or dark theme choice is
  kept in `localStorage` (`dtf-theme`). The pill playground keeps the chosen
  preset and the token JSON you edit there (`dtf-demo`). Nothing else is stored.
- **Nothing is loaded from other hosts.** Scripts, styles and the IBM Plex
  Sans font files the font tokens describe come from the site itself; the
  site's own text uses the system's fonts. The Content Security Policy below
  enforces this in the browser, and the Website checks in CI fail on any
  request to another origin ([`e2e/network.spec.ts`](e2e/network.spec.ts)).
- **No referrer is sent.** Each page has `<meta name="referrer"
content="no-referrer">`.
- **Token values can't run code.** Every value rendered into the page is escaped
  for HTML first (see
  [`render-design-token.ts`](src/tokens/utils/render-design-token.ts) and its
  tests).
- **Token values can't add CSS.** Every value is checked against its `$type`
  when a token file is read, as DTCG 2025.10 defines them: numbers are
  numbers, units are `px` or `rem` (`ms` or `s` for durations), `hex` is a 6
  digit hex color, color components are in their color space's range, and
  keywords are from the spec's lists. A token that doesn't match is refused
  with an error naming it and the field, so the file isn't shown, also in the
  playground ([`validate-token.ts`](src/tokens/utils/validate-token.ts),
  [#31](https://github.com/phun-ky/site-design-token-flow/issues/31)). Font
  names, which are free text, are escaped for CSS.

What you can't rely on yet:

- **Protections that need response headers.** GitHub Pages can't be configured
  to send headers, and some protections can't be set from a `<meta>` tag: the
  site can be framed by other sites (`frame-ancestors`), there is no
  `X-Content-Type-Options`, no HSTS for the custom domain (HTTP does redirect to
  HTTPS), and no reporting of policy violations. The site has no account, form
  or action to trick someone into, which limits what framing could do.

## Content Security Policy

Every built page carries this policy as a `<meta http-equiv>` tag, right after
`<meta charset>` (added by
[`src/build/security-meta.ts`](src/build/security-meta.ts)):

```text
default-src 'none'; script-src 'self' 'sha256-…'; style-src 'self';
style-src-attr 'unsafe-inline'; img-src 'self'; font-src 'self';
base-uri 'none'; form-action 'none'
```

- **Scripts** come only from the site. The one inline script, which applies the
  saved theme before the first paint, is allowed by its SHA-256 hash, computed
  at build time from the page itself, so it can't go stale.
- **Styles** come only from the site. `style` attributes are allowed because the
  pills set their swatch colours with them.
- **Images and fonts** come only from the site. The fonts are the files the
  font tokens list, so a token file can't make the page fetch a font from
  another host.
- **Everything else** is blocked, including connections and frames from any
  host, and `<base>` and form targets.

The policy is added only to the build. `npm run dev` runs without it, since Vite
injects styles there. The 404 page
([`site/public/404.html`](site/public/404.html)), which Vite copies as it is,
carries the same policy written by hand, without a script hash: it has no
scripts.

## Dependencies

**Choosing them.** The site bundles two runtime libraries:
[`@phun-ky/arclace`](https://www.npmjs.com/package/@phun-ky/arclace), which
draws the lines between tokens, and [`shiki`](https://shiki.style), which
highlights code in the playground (only its core, the JavaScript regular
expression engine and the JSON and HTML grammars, loaded after the page;
[#76](https://github.com/phun-ky/site-design-token-flow/issues/76)).
Everything else is a development dependency. A
new runtime dependency is discussed in an issue first, and must be widely used,
actively maintained and under an OSI-approved licence compatible with MIT.

**Obtaining them.** Packages come only from the npm registry, with exact
versions locked in `package-lock.json` and installed with `npm ci` in CI.

**Vendored files.** The IBM Plex Sans `woff2` files in
[`site/public/fonts/`](site/public/fonts/) come from `@ibm/plex-sans` 1.1.0 and
`@ibm/plex-sans-variable` 0.2.0 on npm (tarballs checked against the registry's
integrity hash), under the SIL Open Font License 1.1, whose text ships next to
them. They are copied instead of installed because both packages run a
`postinstall` script that sends usage telemetry to IBM
([#58](https://github.com/phun-ky/site-design-token-flow/issues/58)). To update
them, copy the `woff2` files and the licence from a newer version of those
packages.

**Tracking them.** Dependabot proposes version updates weekly and security
updates as soon as an advisory is published.

**Fixing known vulnerabilities.** Findings are checked against the GitHub
Advisory Database:

| Finding          | Where                              | What happens                        |
| ---------------- | ---------------------------------- | ----------------------------------- |
| Critical or high | Runtime dependency (in the bundle) | Fixed within 7 days                 |
| Critical or high | Development dependency             | Fixed within 30 days                |
| Moderate or low  | Any dependency                     | Fixed with the next update, 90 days |

Current state: `npm audit --omit=dev` reports nothing, and `npm audit` reports
only the accepted exception below.

**Before a change is merged.** Dependency review checks every pull request
against the GitHub Advisory Database and blocks it when it adds a dependency
with a high or critical advisory, runtime or development, unless the advisory is
an accepted exception below.

**Before a deploy.** Every deploy is a merge to `main` that passed those checks.
A deploy is not held back for an advisory published after the merge: holding it
would leave the previous build live, which has the same dependency. The fix is
deployed instead, within the times in the table above.

**Accepted exceptions.** Each is listed under `allow-ghsas` in
[`dependency-review.yml`](.github/workflows/dependency-review.yml), and as a
`not_affected` statement in the VEX document
[`vex.openvex.json`](vex.openvex.json):

| Advisory                                                                 | Package                   | Why it is accepted                                                                                                                                                                                                                                                                                                                                        | Remove when                                                                                                       |
| ------------------------------------------------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | `minimatch` 10 (moderate) | Development only, through ESLint, typescript-eslint and eslint-plugin-import-x, which all require `minimatch` 10 even at their latest versions. The fix is `minimatch` 11, which removes `makeRe` and makes ESLint crash on start. The denial of service needs crafted glob patterns; the only patterns here are the repository's own lint configuration. | ESLint, typescript-eslint and eslint-plugin-import-x accept `minimatch` 11, at the latest by 2027-02-03 (90 days) |

One other development-only advisory is fixed with an override in
`package.json`, because the package that pulls it in still requires the
vulnerable range at its latest version: `katex` 0.18 under
`micromark-extension-math`
([GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7)).
Remove the override once `micromark-extension-math` allows the fixed version.

## Code Scanning

CodeQL (GitHub's default setup) analyses every pull request and every push to
`main`, for the TypeScript code and the GitHub Actions workflows. The ruleset on
`main` blocks merging while CodeQL reports an error, or a security alert of high
or critical severity. Other alerts are fixed within 90 days, or dismissed in
GitHub with the reason they can't be exploited.
[OpenSSF Scorecard](https://scorecard.dev/viewer/?uri=github.com/phun-ky/site-design-token-flow)
scores the repository's practices weekly and on every push to `main`, and
publishes the result. The answers to the
[OpenSSF Best Practices](https://www.bestpractices.dev/projects/16376) criteria
are kept in [`.bestpractices.json`](.bestpractices.json) and checked in CI.

## Secrets

The project keeps as few secrets as possible:

| Secret          | Used by     | For                                |
| --------------- | ----------- | ---------------------------------- |
| `CODECOV_TOKEN` | `check.yml` | Uploading test coverage to Codecov |

Deploying needs no secret: the Deploy workflow uses the short-lived token
GitHub gives each run, with `pages: write` and `id-token: write` for that job
only.

- **Storage:** secrets are kept only as encrypted GitHub Actions secrets, never
  in the repository. Secret scanning with push protection blocks commits that
  contain a credential.
- **Access:** only the maintainer can add or change them, GitHub never shows a
  saved value again, and they are not available to workflows run from forks.
- **Rotation:** at least once a year, and at once if one may have been exposed.

## Assurance Case

Why these expectations hold, where they don't hold yet, and the threat model and
trust boundaries behind them are set out in the
[assurance case](ASSURANCE.md).
