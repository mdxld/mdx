/**
 * Types for @mdxe/esbuild
 */

import React from 'react'

/**
 * Represents a code block extracted from MDX content
 */
export interface CodeBlock {
  lang: string
  meta: string | null
  value: string
}

/**
 * Represents an MDX content item with frontmatter, raw markdown, compiled component, and executable code blocks
 */
export interface MdxContentItem {
  /** Frontmatter data extracted from the MDX file */
  data: Record<string, any>
  /** Raw markdown content of the file */
  markdown: string
  /** Compiled React component */
  default: (props?: any) => React.ReactElement
  /** Executable code blocks extracted from the MDX file */
  code: CodeBlock[]
  /** Test code blocks extracted from the MDX file */
  test: CodeBlock[]
  /** Any other named exports from the MDX file */
  [key: string]: any
}

/**
 * Map of MDX content items keyed by TitleCased file names
 */
export interface MdxContentMap {
  [key: string]: MdxContentItem
}

/**
 * Options for the MDX esbuild plugin
 */
export interface MdxeBuildOptions {
  /** Directory containing MDX files to process */
  contentDir?: string
  /** Output file path for the bundled content */
  outFile?: string
  /** Custom remark plugins to use in addition to the defaults */
  remarkPlugins?: any[]
  /** Custom rehype plugins to use */
  rehypePlugins?: any[]
  /** Whether to watch for file changes */
  watch?: boolean
  /** Whether to extract and bundle executable code blocks */
  extractCodeBlocks?: boolean
}
