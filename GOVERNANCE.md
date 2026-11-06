# Governance

Design Token Flow is a small open source project with a single maintainer. This
document describes how decisions are made, who does what, and what happens if
the maintainer can't continue.

## Model

The project follows a **maintainer-led** model: the maintainer makes the final
decision on what goes into the project, guided by the [roadmap](ROADMAP.md) and
the discussion with contributors.

Decisions are made in public:

- **Proposals** are made as
  [GitHub issues](https://github.com/phun-ky/site-design-token-flow/issues).
  Larger changes, such as a new page, a new runtime dependency or a change to
  how tokens are read, are discussed in an issue before work starts, and the
  decision is recorded there.
- **Changes** are made as pull requests, reviewed by the maintainer, and merged
  only when the required checks pass.
- **Disagreements** are resolved by discussion in the issue or pull request. If
  that doesn't settle it, the maintainer decides and explains why.
- **Conduct** is governed by the [Code of Conduct](CODE_OF_CONDUCT.md), which
  the maintainer enforces.

### Reviews

With one maintainer, a pull request by the maintainer has no second reviewer.
The rules on `main` therefore require pull requests, resolved review threads and
passing checks (lint, formatting, types, tests, the build, dependency review,
CodeQL and the DCO), but no approving review, and the maintainer can bypass
them. Once there is a second maintainer, pull requests need an approving review
from a maintainer other than the author.

## Roles

| Role            | Who                                                                        | Responsibilities                                                                                                                                                                                      |
| --------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maintainer**  | Alexander Vassbotn Røyne-Helgesen ([@phun-ky](https://github.com/phun-ky)) | Sets the direction and roadmap; triages issues; reviews and merges pull requests, which deploys the site; handles security reports; enforces the Code of Conduct; manages the repository and the site |
| **Contributor** | Anyone who opens an issue or a pull request                                | Follows the [contributing guide](CONTRIBUTING.md) and the Code of Conduct; includes tests with code changes                                                                                           |

### Becoming a maintainer

Contributors who have made sustained, high-quality contributions may be invited
to become maintainers. A new maintainer gets write access to the repository and
is added to this document, and from then on the project needs a review from a
maintainer other than the author before merging.

Before anyone is given write access or any other escalated permission, the
maintainer reviews their contribution history and confirms that their GitHub
account uses two-factor authentication. They get the lowest role that lets them
do the work, and the change is recorded in the roles table above.

## Continuity

Today, one person holds everything needed to run the project: admin access to
the [GitHub repository](https://github.com/phun-ky/site-design-token-flow),
which builds and deploys the [site](https://phun-ky.net/site-design-token-flow/)
to GitHub Pages, and the `phun-ky.net` domain it is served under.

- **Deploys** run from GitHub Actions on every merge, with no personal token, so
  anyone who can merge to `main` can update the site.
- **The code** is MIT-licensed. Anyone can fork it and publish it elsewhere
  under a new name if the project stops; the site is static and runs on any
  static host.
- **A second person with access** doesn't exist yet. Until there is one, the
  project can't continue under its own name if the maintainer is unavailable.
