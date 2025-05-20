# Releasing and Preview Workflow

This repository uses [pkg.pr.new](https://github.com/stackblitz-labs/pkg.pr.new) to automatically build and publish preview packages.

## Prerelease workflow

Every push or pull request triggers the `prerelease` GitHub Action defined in `.github/workflows/prerelease.yml`.
The workflow performs the following steps:

1. Checks out the repository.
2. Installs dependencies with pnpm.
3. Runs the build for all packages.
4. Publishes preview packages using `pkg-pr-new publish`.

The pkg.pr.new GitHub App must be installed on the repository so the action can upload preview packages. After a run on a pull request, the bot comments with instructions for installing the preview package, e.g.

```
npm i https://pkg.pr.new/<package>@<commit-hash>
```

These prereleases allow testing any commit before an official release.

## Official releases

Stable releases use the `changesets` workflow. When ready, run:

```bash
pnpm run release
```

This builds the packages and publishes them to npm with proper versioning.
