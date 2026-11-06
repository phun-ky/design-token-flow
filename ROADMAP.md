# Roadmap

What Design Token Flow intends to do, and not do, from November 2026 to
November 2027. It's a plan, not a promise: priorities can change, and changes to
this file are made in pull requests like any other. Individual pieces of work
are tracked as
[GitHub issues](https://github.com/phun-ky/site-design-token-flow/issues).

## Planned

### The pill renderer as its own package

`src/tokens/`, which reads DTCG 2025.10 token files, validates them and renders
tokens as pills, becomes its own npm package. It is kept self-contained for
that: nothing in it imports the site's code, and the site uses it only through
its public API. The steps, and the decisions still to make (its name, and with
it possibly the `$extensions` key), are in
[its README](src/tokens/README.md#extracting-into-a-package). The deprecated
package `@phun-ky/design-token-flow` points to it once it exists.

### Project health

- **OpenSSF Scorecard and Best Practices:** a Scorecard workflow, and the
  passing badge
  ([#21](https://github.com/phun-ky/site-design-token-flow/issues/21)).
- **A second maintainer**, so that pull requests get a review from someone other
  than the author and access to the project doesn't rest on one person; see
  [governance](GOVERNANCE.md#continuity).

## Proposals, not decided

Ideas that fit the project but are not decided. Each would be discussed in an
issue first.

- **A desktop app:** the site wrapped in Electron, for use offline. The site is
  built with relative paths so that it can be.
- **Your own token file in the flow view:** open or drop a `*.tokens.json` file
  to see its flow, as the playground does for single tokens. It would stay in
  the browser, like the playground's.

## Not planned

- **Accounts, a server or storing tokens anywhere.** The site is static, and
  what you paste into the playground stays in your browser.
- **Collecting data.** The site doesn't track visitors or send anything
  anywhere, and loads nothing from other hosts.
- **Runtime dependencies without discussion.** A new library in the site is
  discussed in an issue first; see the [security policy](SECURITY.md#dependencies).
