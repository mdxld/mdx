## [`mdxai`](./packages/mdxai) - Generate & Edit Markdown & MDX

```bash
mdxai generate 100 blog post titles about the future of work post-AGI
```

## [`mdxdb`](./packages/mdxdb) - Markdown/MDX Files as a Database

```ts
import { ai } from 'mdxai'
import { db } from 'mdxdb'

const count = 100
const topic = 'the future of work post-AGI'
const titles = await ai.list`${count} blog post titles about ${topic}`

for (const title of titles) {
  const post = await ai`Write a blog post about ${title}`
  await db.set(`blog/${title.replace(' ', '_')}`, post)
}
```

## [`mdxld`](./packages/mdxld) - Linked Data for Markdown & MDX

MDXLD builds upon the foundations of Linked Data like (JSON-LD and YAML-LD) with ontologies like [schema.org](https://schema.org), to create a powerful integration between structured data and content.

```mdx
---
$id: https://example.com
$type: https://schema.org/WebSite
title: Example Domain
description: This domain is for use in illustrative examples in documents
---

# Example Domain

This domain is for use in illustrative examples in documents. You may use this
domain in literature without prior coordination or asking for permission.

[More information...](https://www.iana.org/domains/example)
```

## [`mdxe`](./packages/mdxe) - Build, Execute, Test, & Deploy Code in Markdown & MDX

MDXE is a zero-config CLI that allows you to build, execute, test, and deploy code in Markdown & MDX files. It uses MDX, ESBuild, ESLint, Next.js, React, Velite, and Vitest under the hood to rapidly develop apps and sites.

````markdown
# Addition

Sometimes you need to `sum` two numbers:

```typescript
export function sum(a: number, b: number): number {
  return a + b
}
```

and make sure it works:

```typescript test
describe('sum', () => {
  it('returns the sum of two positive numbers', () => {
    expect(sum(2, 3)).toBe(5)
  })
})
```
````

And you can execute the tests:

```bash
mdxe test
```

and run the app which uses:

```bash
mdxe dev

#  next dev --turbopack --port 3000

#    ▲ Next.js 15.3.0 (Turbopack)
#    - Local:        http://localhost:3000
#    - Network:      http://192.168.6.6:3000

#  ✓ Starting...
#  ✓ Ready in 1995ms
```

And you can develop and deploy entire projects with `mdxe`:

```json5
// package.json
{
  scripts: {
    dev: 'mdxe dev',
    build: 'mdxe build',
    start: 'mdxe start',
    test: 'mdxe test',
    lint: 'mdxe lint',
  },
}
```

## [`mdxui`](./packages/mdxui) - UI Component Library for MDX

All of the `mdxui` components are available automatically in `mdxe`

```mdx
<Hero
  headline='Bring your ideas to life with MDX'
  content='MDX combines unstructured content in Markdown, structured data in YAML, executable code, and UI components.'
/>
```

The components can also be used in any React/Next.js application:

```tsx
// mdx-components.tsx
export { useMDXComponents } from 'mdxui'
```
