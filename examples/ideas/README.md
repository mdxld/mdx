# AI Agent Ideas

A collection of MDX files containing AI agent ideas. This package demonstrates how mdxe can build and generate modules for export.

## Usage

This package uses mdxld's build functionality to generate a module output from the MDX files. To build the module:

```bash
pnpm build
```

This will create a `.mdx` directory containing the generated module files.

## Structure

- `src/`: Contains the MDX files with AI agent ideas
- `.mdx/`: Output directory for the generated module (created by the build command)

## Importing

You can import the generated module in other projects like this:

```js
import * as ideas from 'ideas-example/ideas';
```
