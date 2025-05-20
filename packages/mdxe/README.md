# `mdxe` - Zero-Config CLI to Execute, Test, & Deploy Markdown & MDX

`mdxe` allows you to run TypeScript code blocks embedded in Markdown/MDX files and even deploy full sites or notebooks built with those documents. It bundles together MDX, ESBuild, React, Next.js and Vitest so you can iterate quickly without custom configuration.

## Features

- Execute `ts`/`js` code blocks directly from your documents.
- Built‑in test runner for code snippets using Vitest.
- Development and production build commands for MDX driven apps.
- Tight integration with `mdxui` components for rich UIs.
- Helper functions for [`next-mdx-remote-client`](https://github.com/ipikuka/next-mdx-remote-client)

## Example

```bash
mdxe test
```

### next-mdx-remote-client utilities

Two helpers are provided to make working with `next-mdx-remote-client` and `mdxdb` easier:

```ts
import { compileEntry, listFrontmatter } from 'mdxe'

const mdxSource = await compileEntry(db, 'my-post', 'articles')
const frontmatterList = listFrontmatter(db, 'articles')
```

