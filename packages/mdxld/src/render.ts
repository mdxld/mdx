import React from 'react';
import { compile, evaluate } from '@mdx-js/mdx';
import { VFile } from 'vfile';
import * as runtime from 'react/jsx-runtime';
import * as ReactDOMServer from 'react-dom/server';
import TurndownService from 'turndown';
import { parseFrontmatter } from './parser.js';

export interface RenderOptions {
  /**
   * Additional components to provide to MDX
   */
  components?: Record<string, React.ComponentType<any>>;
  
  /**
   * Additional data to provide to the MDX scope
   */
  scope?: Record<string, any>;
}

export interface RenderResult {
  /**
   * The rendered markdown content
   */
  markdown: string;
  
  /**
   * The parsed frontmatter from the MDX file
   */
  frontmatter: Record<string, any> | null;
}

/**
 * Render MDX content to markdown string
 * @param mdxContent - The MDX content to render
 * @param options - Options for rendering including components and scope
 * @returns Object containing the rendered markdown and frontmatter
 */
export async function render(mdxContent: string, options: RenderOptions = {}): Promise<RenderResult> {
  try {
    const { frontmatter } = parseFrontmatter(mdxContent);
    
    const frontmatterRegex = /^\s*---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/;
    const contentWithoutFrontmatter = mdxContent.replace(frontmatterRegex, '');
    
    const compiled = await compile(new VFile(contentWithoutFrontmatter), {
      jsx: true,
      jsxImportSource: 'react',
    });
    
    const { default: Component } = await evaluate(compiled, {
      ...runtime,
      ...options.scope
    });
    
    const html = ReactDOMServer.renderToString(
      React.createElement(Component, { components: options.components })
    );
    
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(html);
    
    return {
      markdown,
      frontmatter
    };
  } catch (error) {
    throw new Error(`Failed to render MDX: ${error instanceof Error ? error.message : String(error)}`);
  }
}
