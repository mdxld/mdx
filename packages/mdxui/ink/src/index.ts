export * from './types'
export * from './render'
export * from './schema'
export * from './frontmatter'
export * from './components'
export * from './icons'
export * from './workflow'
export type { WorkflowFrontmatter } from './types'
export * from './LandingPage'
export * from './slides'
export * from './slide'

import MarkdownComponent from './markdown'
import AsciiComponent from './ascii'
export { MarkdownComponent as Markdown, AsciiComponent as Ascii }

import * as types from './types'
import * as render from './render'
import * as schema from './schema'
import * as frontmatter from './frontmatter'
import * as components from './components'
import { Slides } from './slides'
import { Slide } from './slide'

const Ink: {
  renderMdxCli: typeof render.renderMdxCli;
  Slides: typeof Slides;
  Slide: typeof Slide;
  Markdown: typeof MarkdownComponent;
  Ascii: typeof AsciiComponent;
  [key: string]: any;
} = {
  ...types,
  ...render,
  ...schema,
  ...frontmatter,
  ...components,
  Slides,
  Slide,
  Markdown: MarkdownComponent,
  Ascii: AsciiComponent
}

export default Ink
