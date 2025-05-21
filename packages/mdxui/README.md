# `mdxui` - UI Component Library for MDX

`mdxui` is a collection of reusable React components tailored for Markdown and MDX content. The library focuses on simplicity and works out of the box with `mdxe`, making components such as `<Hero>` automatically available in your documents. You can also import and use them in any React or Next.js project.  The package also includes Tremor, a modern React charting library.

## Example

```mdx
<Hero
  headline='Bring your ideas to life with MDX'
  content='MDX combines unstructured content in Markdown, structured data in YAML, executable code, and UI components.'
/>
```

```tsx
// mdx-components.tsx
export { useMDXComponents } from 'mdxui'
```

```tsx
import { Button } from 'mdxui'

export default function Example() {
  return <Button variant='primary'>Click me</Button>
}
```
