# npm-only package management design

## Goal

Make npm the documented and reproducible package manager for Realmbound Logic without adding install-time enforcement.

## Repository changes

- Remove the tracked `pnpm-lock.yaml` file.
- Remove the untracked local `.pnpm-store` directory.
- Retain and commit `package-lock.json` as the sole dependency lockfile.
- Add a `packageManager` field to `package.json` using the npm version that generated the lockfile.
- Keep the existing `dev`, `build`, `test`, and `test:run` scripts because they already use package-manager-neutral local binaries.

## Usage

Developers install dependencies with `npm install` and run the application with `npm run dev`. Tests and production builds use `npm run test:run` and `npm run build`.

## Error handling

The repository will not add a preinstall hook that rejects other package managers. The single lockfile and `packageManager` metadata communicate the supported workflow without introducing platform-specific enforcement behavior.

## Verification

After the metadata migration:

1. Run `npm install` successfully.
2. Run `npm run test:run` successfully.
3. Run `npm run build` successfully.
4. Confirm no pnpm-specific tracked or untracked artifacts remain.

