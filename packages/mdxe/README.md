# `mdxe` - Zero-Config CLI for MDX Development

`mdxe` is a zero-configuration CLI that brings together the power of MDX, React, Next.js, and modern build tools into a unified development environment. Execute TypeScript code blocks directly from your Markdown files, build full-stack applications, and deploy with minimal setup.

## Features

- **Zero Configuration** - Works out of the box without complex setup
- **Code Block Execution** - Run TypeScript/JavaScript directly from MDX files
- **Full-Stack Development** - Built-in Next.js integration for web applications
- **Test Runner** - Execute tests embedded in your documentation
- **Build Pipeline** - Production-ready builds with esbuild optimization
- **Component Integration** - Seamless integration with `@mdxui` components

## Installation

```bash
npm install -g mdxe
# or
pnpm add -g mdxe
# or
yarn global add mdxe
```

## Quick Start

```bash
# Execute code blocks in an MDX file
mdxe exec README.md

# Start development server
mdxe dev

# Run tests
mdxe test

# Build for production
mdxe build
```

## Architecture

`mdxe` consists of two main sub-packages that work together:

### [@mdxe/cli](./cli/README.md)
The command-line interface that provides:
- Code block execution engine
- Development and production servers
- Test runner with Vitest integration
- Event system for inter-block communication

### [@mdxe/esbuild](./esbuild/README.md)
The build system that handles:
- MDX file processing and bundling
- Code block extraction and categorization
- Content aggregation into consumable modules
- Integration with esbuild for fast builds

## Usage Examples

### Execute Code Blocks
```mdx
# My Document

\`\`\`typescript
console.log('This code runs automatically!')
\`\`\`

\`\`\`typescript test
// This runs only during testing
expect(2 + 2).toBe(4)
\`\`\`
```

### Share State Between Blocks
```typescript
// First block
exportVar('data', { count: 0 })

// Second block  
const data = importVar('data')
data.count++
console.log(data.count) // 1
```

### Event Communication
```typescript
// Listen for events
on('user-action', (payload) => {
  console.log('Received:', payload)
})

// Send events
send('user-action', { type: 'click', target: 'button' })
```

## Integration with MDX Ecosystem

`mdxe` works seamlessly with other MDX ecosystem packages:

- **[@mdxui](../mdxui/README.md)** - UI components automatically available
- **[@mdxai](../mdxai/README.md)** - AI functions for content generation
- **[@mdxdb](../mdxdb/README.md)** - Database operations on MDX files
- **[@mdxld](../mdxld/README.md)** - Linked data and schema integration

## License

MIT
