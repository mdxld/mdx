# `mdxui` – Component Library for MDX

`mdxui` is a collection of UI packages that provide ready‑to‑use React components for Markdown and MDX content. Each package focuses on a different environment—from web apps to the terminal. All packages can be used individually or through the main `mdxui` bundle, which re‑exports them under namespaces like `Core`, `Shadcn` and `Ink`.

```ts
import { Core, Shadcn } from 'mdxui'
```

The sections below outline the available sub‑packages and their primary APIs.

## Packages

### `@mdxui/core`

Base components and types used throughout the ecosystem.

```ts
import { Button } from '@mdxui/core'
```

- Reusable React components such as `<Button>` and `<Card>`
- Landing page section interfaces and workflow types
- Includes Tremor chart components

### `@mdxui/shadcn`

Web UI built on top of shadcn‑ui and Tailwind CSS.

```tsx
import { Button, Card } from '@mdxui/shadcn'
```

- Styled primitives (`Button`, `Card`, etc.)
- Uses class‑variance authority to provide `variant` and `size` props

### `@mdxui/magicui`

Motion and visual effect components powered by Framer Motion.

```tsx
import { Confetti, Globe } from '@mdxui/magicui'
```

- Animated text utilities (`NumberTicker`, `WordRotate`, …)
- Decorative components like `<Globe>` and `<Confetti>`

### `@mdxui/ink`

Render MDX as interactive terminal apps with React Ink and Pastel.

```ts
import { renderMdxCli } from '@mdxui/ink'
await renderMdxCli('./app.mdx')
```

- Parse frontmatter to create CLIs and workflows
- Components for building terminal UIs

### `@mdxui/reveal`

Components for slide decks using Reveal.js.

```tsx
import { Slides, Slide } from '@mdxui/reveal'
```

- `<Slides>` container that boots Reveal.js
- `<Slide>` wrapper for each slide’s content

### `@mdxui/remotion`

Utilities and components for programmatic video generation with Remotion.

```ts
import { Main } from '@mdxui/remotion'
```

- Prebuilt components for animated code walkthroughs
- Development commands via `remotion` CLI

### `@mdxui/tailwind`

Shared Tailwind CSS configuration and styles.

```ts
import tailwind from '@mdxui/tailwind'
```

- Provides a default `postcss.config.js`
- Exports common CSS utilities

### `@mdxui/slack`

Experimental Slack Block Kit framework.

```ts
export * from '@mdxui/slack'
```

- Next.js route handlers for Slack webhooks
- JSX primitives to build Slack messages and modals

## Using with `mdxe`

When running `mdxe`, all core components are automatically available in your MDX files. You can also import any of the sub‑packages directly in a React or Next.js project.

---

MIT License
