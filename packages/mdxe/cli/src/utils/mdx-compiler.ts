import { renderMdxCli } from '@mdxui/ink';
import { parseFrontmatter } from '@mdxui/ink';
import type { MdxFrontmatter } from '@mdxui/ink';

/**
 * Render MDX content in the CLI
 * This is a wrapper around the renderMdxCli function from @mdxui/ink
 */
export async function renderMdx(mdxContent: string, options: RenderMdxOptions = {}) {
  try {
    return await renderMdxCli(mdxContent, {
      mdxPath: options.mdxPath,
      components: options.components,
      scope: options.scope
    });
  } catch (error) {
    console.error('Error rendering MDX:', error);
    throw error;
  }
}

/**
 * Options for MDX rendering
 */
export interface RenderMdxOptions {
  /**
   * Path to the MDX file
   */
  mdxPath?: string;
  
  /**
   * Additional components to provide to MDX
   */
  components?: Record<string, any>;
  
  /**
   * Additional data to provide to the MDX scope
   */
  scope?: Record<string, any>;
}

/**
 * Default component mapping for MDX elements to Ink components
 */
export const defaultComponentMapping = {
  h1: 'Text',
  h2: 'Text',
  h3: 'Text',
  h4: 'Text',
  h5: 'Text',
  h6: 'Text',
  
  p: 'Text',
  blockquote: 'Box',
  ul: 'Box',
  ol: 'Box',
  li: 'Text',
  
  a: 'Text',
  strong: 'Text',
  em: 'Text',
  code: 'Text',
  pre: 'Box',
  
  hr: 'Box',
  table: 'Box',
  thead: 'Box',
  tbody: 'Box',
  tr: 'Box',
  th: 'Text',
  td: 'Text'
};

/**
 * Create a component mapping for MDX elements to Ink components
 */
export function createComponentMapping(customMapping = {}) {
  return {
    ...defaultComponentMapping,
    ...customMapping
  };
}
