import remarkGfm from 'remark-gfm'

/**
 * Default remark plugins to use with MDX
 */
export const defaultRemarkPlugins = [
  remarkGfm, // GitHub Flavored Markdown support
]

/**
 * Default rehype plugins to use with MDX
 */
export const defaultRehypePlugins = []

/**
 * Configuration for MDX plugins
 */
export interface MDXPluginOptions {
  /**
   * Remark plugins to use with MDX
   */
  remarkPlugins?: any[]

  /**
   * Rehype plugins to use with MDX
   */
  rehypePlugins?: any[]
}

/**
 * Get the configured plugins for MDX compilation
 */
export function getPlugins(options?: MDXPluginOptions): MDXPluginOptions {
  return {
    remarkPlugins: [...(defaultRemarkPlugins || []), ...(options?.remarkPlugins || [])],
    rehypePlugins: [...(defaultRehypePlugins || []), ...(options?.rehypePlugins || [])],
  }
}
