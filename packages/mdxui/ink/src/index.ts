export * from './types'
export * from './render'
export * from './schema'
export * from './frontmatter'
export * from './components'
export * from './components/react-ink'
export * from './icons'
export * from './workflow'
export * from './components/EventStatus'
export * from './components/EventProgressIndicator'
export * from './components/EventListDisplay'
export * from './components/EventStatusProvider'
export type { WorkflowFrontmatter } from './types'
export * from './LandingPage'
export * from './slides'
export * from './slide'
export * from './button'
export * from './card'
export * from './InkMDXRenderer'
export * from './component-loader'
export { registerComponent, registerComponents, getAllComponents } from './component-loader'
export * from './mdx-plugins'
export * from './bundler'
export * from './code-execution'
export * from './ExecutionResults'

import MarkdownDefault from './markdown'
import AsciiDefault from './ascii'
export { MarkdownDefault as Markdown, AsciiDefault as Ascii }

import * as types from './types'
import * as render from './render'
import * as schema from './schema'
import * as frontmatter from './frontmatter'
import * as components from './components'
import { Slides } from './slides'
import { Slide } from './slide'
import { Button } from './button'
import { Card } from './card'

import { InkMDXRenderer } from './InkMDXRenderer'

const Ink: {
  renderMdxCli: typeof render.renderMdxCli
  Slides: typeof Slides
  Slide: typeof Slide
  Button: typeof Button
  Card: typeof Card
  Markdown: typeof MarkdownDefault
  Ascii: typeof AsciiDefault
  InkMDXRenderer: typeof InkMDXRenderer
  [key: string]: any
} = {
  ...types,
  ...render,
  ...schema,
  ...frontmatter,
  ...components,
  Slides,
  Slide,
  Button,
  Card,
  Markdown: MarkdownDefault,
  Ascii: AsciiDefault,
  InkMDXRenderer,
}

export default Ink
