# `@mdxui/shadcn` - Styled UI Components

Beautifully designed React components built on top of shadcn-ui and Tailwind CSS. Provides styled primitives with variant support using class-variance-authority for consistent, customizable UI elements.

## Features

- **Styled Primitives** - Pre-styled Button, Card, and other UI components
- **Variant System** - Built-in support for size and variant props
- **Tailwind Integration** - Seamless integration with Tailwind CSS
- **Accessibility** - Built on Radix UI primitives for accessibility
- **TypeScript** - Full TypeScript support with proper type definitions

## Installation

```bash
npm install @mdxui/shadcn
# or
pnpm add @mdxui/shadcn
# or
yarn add @mdxui/shadcn
```

## Usage

### Button Component

```tsx
import { Button } from '@mdxui/shadcn'

export default function Example() {
  return (
    <div>
      <Button variant="default">Default Button</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}
```

### Card Components

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@mdxui/shadcn'

export default function CardExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content area</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  )
}
```

## Available Components

- **Button** - Styled button with multiple variants
- **Card** - Container component with header, content, and footer sections
- **CardHeader** - Card header section
- **CardTitle** - Card title component
- **CardDescription** - Card description text
- **CardContent** - Main card content area
- **CardFooter** - Card footer section

## License

MIT
