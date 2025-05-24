# mdx-pastel-ink

Create CLI apps using MDX with React Ink and Pastel.

## Features

- Write CLI apps using MDX syntax
- Define input schema in frontmatter
- Use React Ink components for terminal UI
- Pastel for beautiful terminal styling

## Example

```mdx
---
command: deploy
description: Deploy a project to the cloud
input:
  name: string
  os: enum[Ubuntu, Debian]
  memory: number
  region: enum[iad,sfo,lhr]
output:
  result: string
---
<Text>Deploying "{name}" ({os}) with {memory}MB in {region}...</Text>
```

## Installation

```bash
npm install mdx-pastel-ink
# or
yarn add mdx-pastel-ink
# or
pnpm add mdx-pastel-ink
```

## Usage

```typescript
import { renderMdxCli } from '@mdxui/ink';

// Render an MDX file as a CLI app
await renderMdxCli('./path/to/cli.mdx');
```

## License

MIT
