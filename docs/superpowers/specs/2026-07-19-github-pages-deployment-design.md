# GitHub Pages Deployment Design

## Goal

Publish the client-only Realmbound Logic application at
`https://stuf90.github.io/Realmbound-Logic/` whenever a change is pushed to
`main`.

## Architecture

GitHub Actions will build the existing Vite application and deploy the
generated `dist` directory through GitHub Pages' official artifact deployment
flow. No server or runtime service is required because the application keeps
all state in React and browser `localStorage`.

Vite will use `/Realmbound-Logic/` as its production base path so generated
JavaScript and CSS URLs resolve beneath the repository's Pages URL. This base
path also remains valid for local Vite development because Vite serves the
configured path locally.

## Components

- `vite.config.ts` defines the repository base path.
- `.github/workflows/deploy-pages.yml` installs locked npm dependencies, builds
  the application, uploads `dist`, and deploys it to GitHub Pages.
- The workflow runs on pushes to `main` and supports manual dispatch. It grants
  only the permissions required by GitHub Pages and prevents overlapping
  deployments through a concurrency group.

The existing application code, persistence behavior, and navigation remain
unchanged.

## Failure Handling

Dependency installation or compilation failures stop the workflow before an
artifact is deployed. GitHub retains the previous successful Pages deployment.
The deployment job runs only after the build job succeeds.

## Verification

Run the existing test suite and the production build. Inspect `dist/index.html`
to confirm generated asset references begin with `/Realmbound-Logic/`. Review
the workflow structure to confirm it uses the official Pages configuration,
artifact upload, and deployment actions.

## Repository Configuration

After the workflow reaches GitHub, the repository owner must select **GitHub
Actions** as the Pages source under **Settings > Pages** if it is not selected
automatically.
