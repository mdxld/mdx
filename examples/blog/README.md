# Minimal MDXE Example

This is a minimal example of using MDXE to serve Markdown and MDX files with zero configuration.

## Features

- Zero-config setup for serving Markdown and MDX files
- Automatic serving of .md and .mdx files
- Tailwind CSS with Typography plugin for styling
- Includes all components from mdxui package

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Using MDXE Components

MDXE includes all components from the mdxui package, which you can use in your MDX files:

```mdx
import { Button, Card } from 'mdxui'
// Or import specific components from their packages:
// import { Button } from '@mdxui/core'
// import { Card } from '@mdxui/shadcn'

# Welcome to MDXE

<Button>Click Me</Button>

<Card title='MDXE Card'>This is a card component from mdxui.</Card>
```

## Styling with Tailwind

MDXE includes Tailwind CSS with the Typography plugin for beautiful typography:

<div className="prose prose-lg">
  This content is styled with Tailwind Typography.
</div>

## Learn More

- [MDXE Documentation](https://mdxe.org)
- [MDX Documentation](https://mdxjs.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
