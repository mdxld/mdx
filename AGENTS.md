# AGENTS.md

This file provides guidance to Codex when working with the code in this repository. It mirrors the instructions that Claude receives in `CLAUDE.md`.

## Key Commands

```bash
# install all dependencies
pnpm install

# build the entire monorepo (required after install)
pnpm build
pnpm build:packages  # build only packages

# development mode for all apps
pnpm dev

# quality assurance
pnpm lint           # run ESLint across packages
pnpm test           # run Vitest tests
pnpm check-types    # TypeScript type checking
pnpm format         # Prettier formatting

# release workflow
pnpm version        # version bump using changesets
pnpm release        # build and publish packages
```

To work on a specific package you can use:

```bash
pnpm --filter <package> build   # build a package
pnpm --filter <package> test    # run its tests
pnpm --filter <package> dev     # development mode for apps
```

After installing dependencies always run `pnpm build:packages` to ensure packages are built before type checking or testing.

## Available CLI Tools
After building, the following CLIs are available:
- `mdxai` - AI content generation
- `mdxdb` - Database operations on MDX files
- `mdxe` - Full-stack MDX development environment
- `mdxld` - Linked data processing

## Development Notes
- This monorepo uses `pnpm` workspaces and `turborepo`.
- TypeScript is used across packages with strict settings defined in `config/`.
- Formatting is enforced via Prettier. Run `pnpm format` before committing.
- Vitest is used for testing with tests located beside source files.
- When running multiple apps simultaneously use ports 3001 (`mdx.org.ai`), 3002 (`mdxld.org`), and 3003 (`io.mw`).

## When Modifying the Repository
1. Ensure `pnpm lint`, `pnpm test`, and `pnpm check-types` all pass.
2. Format code with `pnpm format`.
3. Commit your changes following conventional commit style.

For more details on the project structure and goals, see `CLAUDE.md`.
