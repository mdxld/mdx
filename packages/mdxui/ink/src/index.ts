export * from './types.js'
export * from './render.js'
export * from './schema.js'
export * from './frontmatter.js'
export * from './components.js'
export * from './icons.js'
export * from './workflow.js'
export type { WorkflowFrontmatter } from './types.js'
export * from './LandingPage.js'
export * from './slides.js'
export * from './slide.js'
export { default as Markdown } from './markdown.js'
export { default as Ascii } from './ascii.js'

import * as types from './types.js'
import * as render from './render.js'
import * as schema from './schema.js'
import * as frontmatter from './frontmatter.js'
import * as components from './components.js'
import { Slides } from './slides.js'
import { Slide } from './slide.js'
import Markdown from './markdown.js'

const Ink: {
  renderMdxCli: typeof render.renderMdxCli;
  Slides: typeof Slides;
  Slide: typeof Slide;
  [key: string]: any;
} = {
  ...types,
  ...render,
  ...schema,
  ...frontmatter,
  ...components,
  Slides,
  Slide,
  Markdown
}

export default Ink
