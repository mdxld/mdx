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

# Welcome to MDXE

<Button>Click Me</Button>

<Card title='MDXE Card'>This is a card component from mdxui.</Card>
```

## Styling with Tailwind

MDXE includes Tailwind CSS with the Typography plugin for beautiful typography:

<div className='prose prose-lg'>
  This content is styled with Tailwind Typography.
</div>

## Learn More

- [MDXE Documentation](https://mdxe.js.org)
- [MDX Documentation](https://mdxjs.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)

## Deploying to Vercel

When deploying to Vercel, you can optionally create a `vercel.json` configuration file in your project root to ensure proper handling of the build directory:

```json
{
  'builds': [
    {
      'src': 'package.json',
      'use': '@vercel/next',
      'config': {
        'distDir': '.next'
      }
    }
  ]
}
```

This configuration explicitly tells Vercel to use the `.next` directory in your project root for the build output. Note that with the latest version of mdxe, this configuration is optional as the tool now automatically detects Vercel deployment environments and handles the build directory appropriately.
