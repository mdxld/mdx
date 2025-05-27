# Component Mapping System for MDX to Ink

The component mapping system in `@mdxui/ink` provides a flexible way to map MDX elements to Ink terminal UI components. This system enables MDX content to be properly rendered in terminal interfaces.

## Overview

The component mapping system consists of:

1. **Default component mappings** - Standard MDX elements (headings, paragraphs, lists, etc.) mapped to appropriate Ink components
2. **File-based component discovery** - Automatic loading of custom components from `mdx-components` files
3. **Programmatic component registration** - API for registering custom components at runtime
4. **Component merging** - Logic to combine components from different sources with proper precedence

## Usage

### Default Components

The package provides default mappings for standard MDX elements:

```tsx
// Default components are automatically used
import { InkMDXRenderer } from '@mdxui/ink'

// Render MDX content with default components
render(<InkMDXRenderer content='# Hello, world!' />)
```

### File-based Component Discovery

Create a file named `mdx-components.tsx` (or `.jsx`, `.ts`, `.js`) in your project:

```tsx
// mdx-components.tsx
import React from 'react'
import { Box, Text } from 'ink'

export const h1 = ({ children }) => (
  <Box borderStyle='single' padding={1}>
    <Text bold color='green'>
      {children}
    </Text>
  </Box>
)

export const p = ({ children }) => <Text>{children}</Text>
```

### Programmatic Component Registration

Register components at runtime:

```tsx
import { registerComponent, registerComponents } from '@mdxui/ink'
import { Box, Text } from 'ink'

// Register a single component
registerComponent('h1', ({ children }) => (
  <Box borderStyle='double' padding={1}>
    <Text bold color='green'>
      {children}
    </Text>
  </Box>
))

// Register multiple components at once
registerComponents({
  p: ({ children }) => <Text color='blue'>{children}</Text>,
  ul: ({ children }) => <Box marginLeft={2}>{children}</Box>,
})
```

### Component Props

Pass components directly to the InkMDXRenderer:

```tsx
import React from 'react'
import { render } from 'ink'
import { InkMDXRenderer } from '@mdxui/ink'
import { Box, Text } from 'ink'

const customComponents = {
  h1: ({ children }) => (
    <Box borderStyle='round' padding={1}>
      <Text bold color='red'>
        {children}
      </Text>
    </Box>
  ),
}

render(<InkMDXRenderer file='./example.mdx' components={customComponents} />)
```

## Component Precedence

The component mapping system merges components from all sources with the following precedence (highest to lowest):

1. Components passed directly to InkMDXRenderer
2. Programmatically registered components
3. Components from mdx-components file
4. Default components

## API Reference

### `registerComponent(name, component)`

Register a single component for MDX rendering.

```tsx
registerComponent('CustomHeading', ({ children }) => (
  <Box borderStyle='double' padding={1}>
    <Text bold color='green'>
      {children}
    </Text>
  </Box>
))
```

### `registerComponents(componentsObject)`

Register multiple components at once.

```tsx
registerComponents({
  CustomParagraph: ({ children }) => <Text color='blue'>{children}</Text>,
  CustomList: ({ children }) => <Box marginLeft={2}>{children}</Box>,
})
```

### `getAllComponents()`

Get all registered components (including programmatically registered ones).

```tsx
const allComponents = await getAllComponents()
```

### `mergeComponents(defaults, overrides)`

Merge two component objects with precedence to overrides.

```tsx
const finalComponents = mergeComponents(defaultComponents, customComponents)
```
