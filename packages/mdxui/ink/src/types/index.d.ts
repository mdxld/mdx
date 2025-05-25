declare module '@mdxui/ink' {
  import React from 'react';
  
  export interface MarkdownProps {
    children: string;
  }
  
  export const Markdown: React.FC<MarkdownProps>;
  
  export interface AsciiProps {
    children: string;
    font?: string;
  }
  
  export const Ascii: React.FC<AsciiProps>;
  
  export interface MdxFrontmatter {
    [key: string]: any;
  }
  
  export interface WorkflowFrontmatter extends MdxFrontmatter {
    title?: string;
    description?: string;
    steps?: string[];
  }
  
  export function parseFrontmatter(content: string): { frontmatter: MdxFrontmatter; content: string };
  export function createSchemaFromFrontmatter(frontmatter: MdxFrontmatter): any;
  export function renderMdxCli(content: string, options?: any): string;
  
  export const landingPageComponents: Record<string, React.ComponentType<any>>;
  
  export const Slides: React.FC<any>;
  export const Slide: React.FC<any>;
}

declare module '@mdxui/ink/dist/markdown.js' {
  import React from 'react';
  
  interface MarkdownProps {
    children: string;
  }
  
  const Markdown: React.FC<MarkdownProps>;
  export default Markdown;
}

declare module '@mdxui/ink/dist/ascii.js' {
  import React from 'react';
  
  interface AsciiProps {
    children: string;
    font?: string;
  }
  
  const Ascii: React.FC<AsciiProps>;
  export default Ascii;
}
