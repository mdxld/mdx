# mdxtra

Zero-config Nextra CLI for instant documentation sites from MDX files.

## Overview

`mdxtra` is a command-line tool that transforms any directory containing MDX files into a beautiful documentation site powered by [Nextra](https://nextra.site/). No configuration required - just run the command and your MDX files become a fully-featured documentation site with navigation, search, and theming.

## Installation

```bash
npm install -g mdxtra
# or
pnpm add -g mdxtra
# or
yarn global add mdxtra
```

## Usage

Navigate to any directory containing MDX files and run:

```bash
# Start development server (default)
mdxtra

# Explicitly start dev server
mdxtra dev

# Build for production
mdxtra build

# Start production server
mdxtra start

# Export static site
mdxtra export
```

The CLI will:
1. Create a symlink to your current directory as the content source
2. Launch a Nextra-powered Next.js application
3. Serve your MDX files as a documentation site at `http://localhost:3000`

## Features

- **Zero Configuration**: Works out of the box with any MDX files
- **Nextra Theme**: Beautiful documentation theme with dark mode support
- **Automatic Navigation**: Generates navigation from your file structure
- **Search**: Built-in search functionality
- **Hot Reload**: Changes to your MDX files are reflected instantly
- **Production Ready**: Build and deploy your docs anywhere

## File Structure

mdxtra works with any directory structure containing MDX files:

```
my-docs/
├── index.mdx          # Homepage
├── getting-started.mdx
├── api/
│   ├── overview.mdx
│   └── reference.mdx
└── guides/
    ├── installation.mdx
    └── configuration.mdx
```

## Frontmatter Support

Enhance your MDX files with frontmatter:

```mdx
---
title: Getting Started
description: Learn how to get started with our platform
---

# Getting Started

Your content here...
```

## Advanced Usage

### Custom Next.js Commands

Pass any Next.js CLI arguments:

```bash
# Custom port
mdxtra dev --port 4000

# Turbo mode
mdxtra dev --turbo

# Production build with custom output
mdxtra build --output export
```

### Environment Variables

Configure behavior with environment variables:

- `PORT`: Custom port (default: 3000)
- `NODE_ENV`: Environment mode

## How It Works

mdxtra embeds a complete Next.js application with Nextra configuration:

1. **Symlink Creation**: Creates `content` symlink to your current directory
2. **Next.js App**: Launches embedded Next.js app with Nextra configuration
3. **Dynamic Routing**: Uses `[[...mdxPath]]` catch-all routing for MDX files
4. **Theme Integration**: Applies `nextra-theme-docs` for consistent styling

## Requirements

- Node.js 18+ 
- MDX files in your working directory

## Troubleshooting

### Permission Issues
If you encounter symlink permission issues on Windows, run your terminal as administrator or use WSL.

### Port Already in Use
Use a different port: `mdxtra dev --port 4000`

### MDX Parsing Errors
Ensure your MDX files have valid syntax. Check the console for specific error messages.

## Related Projects

- [Nextra](https://nextra.site/) - The documentation framework powering mdxtra
- [MDX](https://mdxjs.com/) - Markdown for the component era
- [Next.js](https://nextjs.org/) - The React framework for production

## License

MIT
