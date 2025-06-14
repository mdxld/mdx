import React from 'react'
import { evaluate } from '@mdx-js/mdx'
import { VFile } from 'vfile'
import * as runtime from 'react/jsx-runtime'
import * as runtimeDev from 'react/jsx-dev-runtime'
import * as ReactDOMServer from 'react-dom/server'
import TurndownService from 'turndown'
import { parseFrontmatter } from './parser.js'
import remarkGfm from 'remark-gfm'

export interface RenderOptions {
  /**
   * Additional components to provide to MDX
   */
  components?: Record<string, React.ComponentType<any>>

  /**
   * Additional data to provide to the MDX scope
   */
  scope?: Record<string, any>
}

export interface RenderResult {
  /**
   * The rendered markdown content
   */
  markdown: string

  /**
   * The parsed frontmatter from the MDX file
   */
  frontmatter: Record<string, any> | null
}

/**
 * Render MDX content to markdown string
 * @param mdxContent - The MDX content to render
 * @param options - Options for rendering including components and scope
 * @returns Object containing the rendered markdown and frontmatter
 */
export async function render(mdxContent: string, options: RenderOptions = {}): Promise<RenderResult> {
  try {
    const { frontmatter } = parseFrontmatter(mdxContent)

    const frontmatterRegex = /^\s*---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/
    const contentWithoutFrontmatter = mdxContent.replace(frontmatterRegex, '')

    const dev = process.env.NODE_ENV !== 'production'
    const runtimeLib = dev ? runtimeDev : runtime
    const { default: Component } = await evaluate(new VFile(contentWithoutFrontmatter), {
      ...runtimeLib,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [],
      development: dev,
      format: 'mdx',
      recmaPlugins: [],
      mdExtensions: ['.md', '.mdx'],
      elementAttributeNameCase: 'html',
      ...options.scope,
    })

    const html = ReactDOMServer.renderToString(React.createElement(Component, { components: options.components }))

    const turndownService = new TurndownService()
    const markdown = turndownService.turndown(html)

    return {
      markdown,
      frontmatter,
    }
  } catch (error) {
    console.error('MDX Compilation Error:', error)
    throw new Error(`Failed to render MDX: ${error instanceof Error ? error.message : String(error)}`)
  }
}
