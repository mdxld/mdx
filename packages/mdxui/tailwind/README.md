# `@mdxui/tailwind` - Shared Tailwind Configuration

Shared Tailwind CSS configuration and styles for the MDX ecosystem. Provides consistent styling foundation and utility classes across all MDX UI packages.

## Features

- **Shared Configuration** - Consistent Tailwind setup across packages
- **PostCSS Integration** - Ready-to-use PostCSS configuration
- **Utility Styles** - Common CSS utilities and base styles
- **Landing Page Components** - Pre-built landing page sections
- **Design System** - Cohesive design tokens and variables

## Installation

```bash
npm install @mdxui/tailwind
# or
pnpm add @mdxui/tailwind
# or
yarn add @mdxui/tailwind
```

## Usage

### Import Shared Styles

```css
/* In your main CSS file */
@import '@mdxui/tailwind';
```

### Use PostCSS Configuration

```js
// postcss.config.js
module.exports = require('@mdxui/tailwind/postcss')
```

### Import Landing Page Components

```tsx
import { LandingPage } from '@mdxui/tailwind'

export default function HomePage() {
  return (
    <LandingPage>
      <h1>Welcome to our site</h1>
    </LandingPage>
  )
}
```

### Tailwind Configuration

The package provides a base Tailwind configuration that can be extended:

```js
// tailwind.config.js
const baseConfig = require('@mdxui/tailwind/config')

module.exports = {
  ...baseConfig,
  content: [
    ...baseConfig.content,
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // Your custom extensions
    },
  },
}
```

## Available Exports

- **Default Export** - Shared CSS styles
- **PostCSS Config** - Ready-to-use PostCSS configuration
- **LandingPage** - Landing page component with consistent styling
- **Utility Classes** - Common CSS utility classes

## Integration with Other Packages

This package provides the styling foundation for:
- `@mdxui/core` - Base component styling
- `@mdxui/shadcn` - Styled component variants
- `@mdxui/magicui` - Animation component styling

## License

MIT
