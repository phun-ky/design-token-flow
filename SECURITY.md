# Security Policy

Design Token Flow is a static website: the code in this repository is built into
plain HTML, CSS and JavaScript that show design tokens and how they relate.
There is no server, no account and no database. Every merge to `main` is
deployed to GitHub Pages, at <https://phun-ky.net/design-token-flow/>.

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
[private vulnerability reporting](https://github.com/phun-ky/design-token-flow/security/advisories/new)
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
- **Nothing is loaded from other hosts.** Fonts are the system's, and scripts
  and styles come from the site itself. The Content Security Policy below
  enforces this in the browser; an automated check in CI is also planned
  ([#19](https://github.com/phun-ky/design-token-flow/issues/19)).
- **No referrer is sent.** Each page has `<meta name="referrer"
content="no-referrer">`.
- **Token values can't run code.** Every value rendered into the page is escaped
  for HTML first (see
  [`render-design-token.ts`](src/tokens/utils/render-design-token.ts) and its
  tests).

What you can't rely on yet:

- **Token values are not validated as CSS.** A token file can add CSS
  declarations to a token's `style` attribute and change how its pill looks.
  It can't run script, and the Content Security Policy stops it loading
  anything, such as a background image from another host. This matters only
  for token files you don't control, such as JSON pasted into the playground
  ([#31](https://github.com/phun-ky/design-token-flow/issues/31)).
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
style-src-attr 'unsafe-inline'; img-src 'self'; base-uri 'none';
form-action 'none'
```

- **Scripts** come only from the site. The one inline script, which applies the
  saved theme before the first paint, is allowed by its SHA-256 hash, computed
  at build time from the page itself, so it can't go stale.
- **Styles** come only from the site. `style` attributes are allowed because the
  pills set their swatch colours with them.
- **Everything else** is blocked, including images, fonts, connections and
  frames from any host, and `<base>` and form targets.

The policy is added only to the build. `npm run dev` runs without it, since Vite
injects styles there.

## Dependencies

**Choosing them.** The site bundles one runtime library,
[`@phun-ky/arclace`](https://www.npmjs.com/package/@phun-ky/arclace), which
draws the lines between tokens; everything else is a development dependency. A
new runtime dependency is discussed in an issue first, and must be widely used,
actively maintained and under an OSI-approved licence compatible with MIT.

**Obtaining them.** Packages come only from the npm registry, with exact
versions locked in `package-lock.json` and installed with `npm ci` in CI.

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

**Accepted exceptions.** Each is also listed under `allow-ghsas` in
[`dependency-review.yml`](.github/workflows/dependency-review.yml):

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
`main`, for the TypeScript code and the GitHub Actions workflows.

## Secrets

The only secret is `CODECOV_TOKEN`, which uploads test coverage to Codecov from
CI. Secret scanning is on; push protection, which blocks commits that contain a
credential, is not on yet
([#14](https://github.com/phun-ky/design-token-flow/issues/14)).
