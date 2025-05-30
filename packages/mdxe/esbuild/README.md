# @mdxe/esbuild

An esbuild plugin that processes MDX files and exports them with frontmatter, raw markdown content, and compiled React components.

## Features

- Exports each `**/*.{md,mdx}` file with:
  - `data` (frontmatter)
  - `markdown` (raw source)
  - `default` (the compiled React component)
  - `code` (executable TypeScript/JavaScript code blocks)
  - `test` (test code blocks)
  - any other named exports
- Aggregates them into one `dist/content.mjs` module under TitleCased keys
- Uses Remark (with GFM and frontmatter plugins) and the `@mdx-js/esbuild` plugin
- Extracts and categorizes code blocks for execution engines

## Installation

```bash
npm install --save-dev @mdxe/esbuild
```

Or with pnpm:

```bash
pnpm add -D @mdxe/esbuild
```

## Usage

### Basic Usage

Create a build script:

```js
// build-mdx.js
import { buildMdxContent } from '@mdxe/esbuild'

buildMdxContent({
  contentDir: './content',
  outFile: './dist/content.mjs',
  watch: process.argv.includes('--watch'),
}).catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
```

Run it:

```bash
node build-mdx.js
# Or with watch mode:
node build-mdx.js --watch
```

### As an esbuild Plugin

```js
import { mdxePlugin } from '@mdxe/esbuild'
import * as esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [
      mdxePlugin({
    contentDir: './content',
    outFile: './dist/content.mjs',
  }),
  ],
})
```

### Consuming the Bundle

#### In Next.js

```jsx
// pages/[page].jsx
import content from '../dist/content.mjs'

export async function getStaticPaths() {
  return {
    paths: Object.keys(content).map((slug) => ({ params: { page: slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const page = content[params.page]
  return { props: { data: page.data } }
}

export default function Page({ data }) {
  const Component = content[data.slug].default
  return <Component />
}
```

#### In an Ink CLI app

```js
#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import content from './dist/content.mjs'

const [, , pageName] = process.argv
const page = content[pageName]
if (!page) {
  console.error('Unknown page:', pageName)
  process.exit(1)
}

render(React.createElement(page.default))

## Code Block Extraction

By default, the plugin extracts and categorizes TypeScript/JavaScript code blocks from your MDX files:

### Executable Code Blocks

Code blocks marked with `exec`, `execute`, or no metadata are treated as executable:

```mdx
\`\`\`typescript exec
on('idea.captured', async (idea) => {
  console.log('Processing idea:', idea)
})
\`\`\`

\`\`\`javascript
// Default executable block
function processData(data) {
  return data.map(item => item.value)
}
\`\`\`
```

### Test Code Blocks

Code blocks marked with `test` are categorized separately:

```mdx
\`\`\`typescript test
send('idea.captured', 'test idea')
expect(result).toBe('processed')
\`\`\`
```

### Accessing Code Blocks

```js
import content from './dist/content.mjs'

const page = content.MyPage

// Access executable code blocks
page.code.forEach(block => {
  console.log(`${block.lang} block:`, block.value)
})

// Access test code blocks
page.test.forEach(block => {
  console.log(`Test block:`, block.value)
})
```
```

## API

### buildMdxContent(options)

Builds MDX content into a single ESM bundle.

#### Options

- `contentDir` - Directory containing MDX files to process (default: `./content`)
- `outFile` - Output file path for the bundled content (default: `./dist/content.mjs`)
- `remarkPlugins` - Custom remark plugins to use in addition to the defaults
- `rehypePlugins` - Custom rehype plugins to use
- `watch` - Whether to watch for file changes (default: `false`)
- `extractCodeBlocks` - Whether to extract and bundle executable code blocks (default: `true`)

### mdxePlugin(options)

Creates an esbuild plugin for processing MDX files. Takes the same options as `buildMdxContent`.

## TypeScript Support

```ts
// content.d.ts
declare namespace ContentMap {
  interface Item {
    data: Record<string, any>
    markdown: string
    default: (props?: any) => JSX.Element
    [key: string]: any
  }
  interface DefaultExport {
    [key: string]: Item
  }
}
declare const content: ContentMap.DefaultExport
export default content
```

## Examples

Check out the [examples directory](./examples) for working examples:

- [Minimal example](./examples/minimal) - Basic usage with a simple MDX file

## License

MIT
