# Contributing to Design Token Flow

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued. See the
[Table of Contents](#table-of-contents) for different ways to help and details
about how this project handles them. Please read the relevant section before
making your contribution. It makes it a lot easier for the maintainer and
smooths out the experience for everyone involved.

> And if you like the project, but don't have time to contribute, that's fine.
> There are other easy ways to support the project and show your appreciation:
>
> - Star the project
> - Mention it in your project's readme
> - Tell your friends and colleagues about it

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Contributing Code](#contributing-code)
    - [Architecture](#architecture)
    - [Development](#development)
    - [Coding Style](#coding-style)
    - [Tests](#tests)
    - [Token Files](#token-files)
    - [Dependencies](#dependencies)
    - [Developer Certificate of Origin](#developer-certificate-of-origin)
    - [Commits and Pull Requests](#commits-and-pull-requests)
    - [Deploys](#deploys)
- [Attribution](#attribution)

## Code of Conduct

This project and everyone participating in it is governed by the
[Design Token Flow Code of Conduct](CODE_OF_CONDUCT.md). By participating, you
are expected to uphold this code. Please report unacceptable behaviour to
<code-of-conduct@phun-ky.net>.

## I Have a Question

> If you want to ask a question, we assume that you have read the
> [README](README.md) and tried the [site](https://phun-ky.net/site-design-token-flow/).

Before you ask a question, search the existing
[issues](https://github.com/phun-ky/site-design-token-flow/issues) that might
help you. If you find a suitable issue and still need clarification, write your
question in that issue.

If you still need to ask a question:

- Open an [issue](https://github.com/phun-ky/site-design-token-flow/issues/new).
- Provide as much context as you can about what you're running into.
- Say which page, browser and theme (light or dark) you're using, and include
  the token JSON if it's about how tokens are shown.

## I Want To Contribute

> ### Legal Notice
>
> When contributing to this project, you must agree that you have authored 100%
> of the content, that you have the necessary rights to the content and that the
> content you contribute may be provided under the project licence. You confirm
> this on every commit by signing it off under the
> [Developer Certificate of Origin](#developer-certificate-of-origin).

### Reporting Bugs

#### Before Submitting a Bug Report

A good bug report shouldn't leave others needing to chase you up for more
information. Please:

- Check that it happens on the [live site](https://phun-ky.net/site-design-token-flow/),
  which always runs the latest `main`.
- Search the
  [bug tracker](https://github.com/phun-ky/site-design-token-flow/issues?q=label%3A%22problems%3A+%F0%9F%90%9B+bug%22)
  to see if the bug has already been reported.
- Collect information about the bug:
  - the page (the flow view or the playground) and its URL
  - the browser and its version, the window width and the theme
  - for tokens: the token JSON, ideally pasted into the
    [playground](https://phun-ky.net/site-design-token-flow/playground), and the
    error it shows
  - any errors in the browser console
  - whether you can reproduce it reliably

#### How Do I Submit a Good Bug Report?

> Never report security issues, vulnerabilities or bugs that include sensitive
> information in the issue tracker or elsewhere in public. Report them privately
> as described in the [security policy](SECURITY.md#reporting-a-vulnerability).

Bugs are tracked as GitHub issues. If you run into a problem:

- Open an
  [issue](https://github.com/phun-ky/site-design-token-flow/issues/new) with
  the bug report template.
- Explain the behaviour you expected and the actual behaviour.
- Describe the steps to reproduce it, with the token JSON if tokens are
  involved.
- Add the information you collected above.

Once it's filed, the maintainer labels it and tries to reproduce it. Without a
way to reproduce it, the issue is marked `pending: need repro` until there is
one. A reproduced bug is marked `🐛 needs fix`.

### Suggesting Enhancements

Enhancements, from new features to small improvements, are tracked as
[GitHub issues](https://github.com/phun-ky/site-design-token-flow/issues).

Before suggesting one:

- Try the [site](https://phun-ky.net/site-design-token-flow/) and the
  [playground](https://phun-ky.net/site-design-token-flow/playground) to see if
  it's already possible.
- [Search](https://github.com/phun-ky/site-design-token-flow/issues) for an
  existing suggestion, and add to it instead of opening a new one.
- Check that it fits the [roadmap](ROADMAP.md), including what is not planned.

A good suggestion has a clear title, describes the current behaviour and the
behaviour you'd like instead, and explains why it would be useful to most users.

### Contributing Code

Larger changes are best discussed in an issue first, so the work fits the
[roadmap](ROADMAP.md).

#### Architecture

The site is built with [Vite](https://vite.dev/) into plain HTML, CSS and
JavaScript, and has no server:

- **`site/`** holds the pages: `index.html` is the flow view, `playground.html`
  with `playground-main.ts` the playground, and `showcase.tokens.json` the
  playground's default tokens. **`site/public/`** is copied to the build as it
  is: the IBM Plex Sans fonts, the icons, the social card and the 404 page.
- **`src/main.ts`** is the flow view: it lays the tokens out with
  `src/layout/layout-tokens.ts` (inheritance lanes, alias levels as columns) and
  draws the lines with [`@phun-ky/arclace`](https://www.npmjs.com/package/@phun-ky/arclace).
- **`src/app/`** is the site around it: the header and skip link, the theme
  switch, the zoomable canvas and its keys, loading the token fonts, and, for
  the playground, the Shiki syntax highlighting and the HTML pretty printer.
- **`src/tokens/`** reads and renders design tokens: `flattenTokens()` parses a
  [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) document and validates
  every value against its `$type`, `renderDesignToken()` renders a pill, and its
  stylesheet styles them. It is self-contained and will become its own npm
  package; see [its README](src/tokens/README.md) for its rules and public API.
- **`src/build/security-meta.ts`** is the Vite plugin that adds the Content
  Security Policy to every built page; see the
  [security policy](SECURITY.md#content-security-policy).
- **`src/assets/`** holds the bundled token file and the Shiki code themes.
- **`e2e/`** holds the Playwright checks of the built site, and `serve.mjs`,
  which serves `dist/` the way GitHub Pages does.

#### Development

You need Node.js 24 and npm 11, and Google Chrome for `npm run test:e2e`.

```shell-session
npm ci
npm run dev
```

| Command                | What it does                                                                |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run dev`          | Starts the site at <http://localhost:5173>, the playground at `/playground` |
| `npm run build`        | Builds the site into `dist/`, adding the Content Security Policy            |
| `npm run preview`      | Serves `dist/`                                                              |
| `npm run clean`        | Removes `dist/`                                                             |
| `npm test`             | Runs the unit tests with Node's test runner                                 |
| `npm run test-ci`      | Runs the unit tests with coverage thresholds, as CI does                    |
| `npm run test:e2e`     | Builds the site and runs the Playwright checks in Google Chrome             |
| `npm run typecheck`    | Type-checks the source, the tests and the configuration                     |
| `npm run lint`         | Lints every file, Markdown included, with ESLint                            |
| `npm run lint:fix`     | Fixes what ESLint can fix                                                   |
| `npm run format`       | Formats every file with Prettier                                            |
| `npm run format:check` | Checks the formatting, as CI does                                           |
| `npm run commit`       | Writes a conventional commit message with commitizen                        |

`npm ci` also points Git at `.githooks/`, which signs off your commits (see
[below](#developer-certificate-of-origin)).

#### Coding Style

Code follows the project's [ESLint](https://eslint.org/) configuration
(`eslint-config-phun-ky`), [Prettier](https://prettier.io/) formatting and
TypeScript with strict null checks. A contribution must pass
`npm run lint -- --max-warnings=0`, `npm run format:check` and
`npm run typecheck`. All of them run in CI on every pull request, and a pull
request that fails them can't be merged.

#### Tests

- **New functionality must come with tests.** Unit tests live next to the code
  in `__tests__` folders under `src/` and run with Node's test runner, with jsdom
  where they need a DOM.
- **Bug fixes must come with a regression test** that fails without the fix.
- **Coverage must not drop.** `npm run test-ci` fails when the source falls
  below 85% of lines, 90% of branches or 97% of functions, and CI uploads a
  coverage report to Codecov for every pull request.
- **The built site is checked in Chrome.** `npm run test:e2e` runs the checks in
  `e2e/`: requests only to the site's own origin and no console errors, no
  horizontal scroll at 390, 768 and 1440 px in both themes, every link and file
  resolving, zoom, pan, fit, the theme switch and the playground, and the
  performance budgets. A change in behaviour updates or adds a check there.
- **Performance budgets** are set per page in `e2e/performance.spec.ts`: bytes
  by type, requests and Largest Contentful Paint on a throttled phone. A change
  that needs more raises the budget in the same pull request and says why.

#### Token Files

- Token files follow [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/).
  `flattenTokens()` rejects a value that doesn't match its `$type`, so the
  bundled tokens (`src/assets/data/design-tokens.tokens.json`) and the
  playground's showcase (`site/showcase.tokens.json`) must pass it; a unit test
  checks both.
- This tool's own data goes in `$extensions` under
  `net.phun-ky.design-token-flow`, for example a font token's `files`; see the
  [`src/tokens` README](src/tokens/README.md#font-files-in-tokens).
- Font files a token lists must exist in `site/public/fonts/`; a test checks
  that too.

#### Dependencies

New dependencies follow the [security policy](SECURITY.md#dependencies): a new
runtime dependency, which ends up in the site, is discussed in an issue first.
Versions are pinned in `package-lock.json`, and a version you add by hand should
be at least 14 days old, like Dependabot's cooldown, unless it fixes a security
advisory.

#### Developer Certificate of Origin

Every commit must be signed off under the
[Developer Certificate of Origin](https://developercertificate.org/) (DCO): a
statement that you wrote the change, or otherwise have the right to submit it
under the project's licence. You agree to it by adding a `Signed-off-by` line
with your name and email to the commit message:

```text
Signed-off-by: Your Name <you@example.com>
```

- **Per commit:** `git commit -s` adds the line for you.
- **Always:** `npm ci` sets `core.hooksPath` to `.githooks`, and the hook in
  `.githooks/prepare-commit-msg` adds the line to every commit, including those
  made by `npm run commit` or your editor.
- **Forgot?** Sign off every commit on your branch and push again:
  `git rebase --signoff main` then `git push --force-with-lease`.

The DCO check on every pull request fails if a commit isn't signed off. Commits
by Dependabot are exempt.

#### Commits and Pull Requests

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
  with the [gitmoji](https://gitmoji.dev/) that `npm run commit` adds:
  `feat: 🎸`, `fix: 🐛`, `docs: ✏️`, `refactor: 💡`, `test: 💍`, `chore: 🤖`,
  `ci: 🎡`.
- Open a pull request against `main`. Describe the problem and the fix, what has
  changed, how to test it (with what success and failure look like, and what
  you measured), the impact on the deployed site, and the related issues.
- The Checks workflow lints, checks the formatting, type-checks, runs the unit
  tests with coverage and builds the site (`check`), and runs the Playwright
  checks against the build (Website checks); dependency review, CodeQL and the
  DCO check also run. All of them must pass. Pull requests are merged with a
  merge commit.

#### Deploys

There are no releases: `main` is the site.

1. Every merge to `main` runs the Checks workflow.
2. When it passes, the Deploy workflow checks out `main`, builds it and deploys
   it to [GitHub Pages](https://phun-ky.net/site-design-token-flow/), if `main`
   is still the commit the checks passed; otherwise the newer commit's own run
   deploys it.
3. A failed check or deploy on `main` opens an issue labelled
   `problems: 💔 build failed`. A failed deploy can be re-run from the Actions
   tab.

## Attribution

This guide is based on
[contributing-gen](https://github.com/bttger/contributing-gen).
