# `mdxe` - Zero-Config CLI to Execute, Test, & Deploy Markdown & MDX

`mdxe` allows you to run TypeScript code blocks embedded in Markdown/MDX files and even deploy full sites or notebooks built with those documents. It bundles together MDX, ESBuild, React, Next.js and Vitest so you can iterate quickly without custom configuration.

## Features

- Execute `ts`/`js` code blocks directly from your documents.
- Built‑in test runner for code snippets using Vitest.
- Development and production build commands for MDX driven apps.
- Tight integration with `mdxui` components for rich UIs.
- Share state between code blocks within the same file.

## Code Block Execution

MDXE automatically executes TypeScript/JavaScript code blocks without requiring an explicit `exec` tag.

### Supported Languages
- `typescript`, `ts`
- `javascript`, `js`

### Execution Contexts
Use meta tags to specify execution context:

```typescript test
// This block only runs in test context
```

```typescript dev
// This block only runs in development context
```

```typescript production
// This block only runs in production context
```

```typescript
// This block runs in default context
```

### Sharing Variables Between Blocks
Use the `exportVar` and `importVar` functions to share state between code blocks:

```typescript
// Export a variable
exportVar('myData', { value: 42 })
```

```typescript
// Import a variable in another block
const data = importVar('myData')
console.log(data.value) // 42
```

Event handling is also supported for inter-block communication:

```typescript
on('my-event', (data) => {
  console.log('Received:', data)
})
```

```typescript
send('my-event', 'Hello from another block')
```

## Commands

```bash
# Execute code blocks in a file
mdxe exec path/to/file.mdx

# Run tests in MDX files
mdxe test path/to/test.mdx

# Start development server
mdxe dev

# Build for production
mdxe build
```
