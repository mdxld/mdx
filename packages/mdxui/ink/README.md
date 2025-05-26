# mdx-pastel-ink

Create CLI apps using MDX with React Ink and Pastel.

## Features

- Write CLI apps using MDX syntax
- Define input schema in frontmatter
- Use React Ink components for terminal UI
- Pastel for beautiful terminal styling
- Flexible component mapping system for MDX elements to Ink components
- Support for both file-based and programmatic component registration

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

<Text>
  Deploying "{name}" ({os}) with {memory}MB in {region}...
</Text>
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
import { renderMdxCli, registerComponent, registerComponents } from '@mdxui/ink'

// Render an MDX file as a CLI app
await renderMdxCli('./path/to/cli.mdx')

// Register custom components programmatically
import { Box, Text } from 'ink';

// Register a single component
registerComponent('h1', ({ children }) => (
  <Box borderStyle="double" padding={1}>
    <Text bold color="green">{children}</Text>
  </Box>
));

// Register multiple components at once
registerComponents({
  p: ({ children }) => <Text color="blue">{children}</Text>,
  ul: ({ children }) => <Box marginLeft={2}>{children}</Box>
});
```

For more details on the component mapping system, see [Component Mapping Documentation](./docs/component-mapping.md).

## License

MIT

## Workflows

Create step-based workflows using MDX with structured frontmatter:

```mdx
---
workflow:
  id: my-workflow
  name: My Workflow
  steps:
    - id: step1
      name: First Step
      output:
        result: string
    - id: step2
      name: Second Step
      input:
        result: string
      output:
        final: string
---

# My Workflow

<Text>Processing workflow...</Text>
```

The workflow system automatically:

- Validates input/output with Zod schemas
- Chains step outputs to next step inputs
- Provides type safety for step data
- Generates mock data for testing
