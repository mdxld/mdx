declare module '@mdxui/ink' {
  export interface MdxFrontmatter {
    [key: string]: any;
    title?: string;
    description?: string;
    workflow?: any;
    steps?: any[];
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
  }

  export interface WorkflowFrontmatter extends MdxFrontmatter {
    workflow: {
      id: string;
      name: string;
      description?: string;
      steps: Array<{
        id: string;
        name: string;
        description?: string;
        inputSchema?: any;
        outputSchema?: any;
      }>;
    };
  }

  export interface MdxPastelInkOptions {
    mdxPath?: string;
    components?: Record<string, React.ComponentType<any>>;
    scope?: Record<string, any>;
  }

  export function parseFrontmatter(content: string): { frontmatter: MdxFrontmatter; mdxContent: string };
  export function createSchemaFromFrontmatter(frontmatter: MdxFrontmatter): { inputSchema: any; outputSchema: any };
  export function renderMdxCli(mdxContentOrPath: string, options?: Partial<MdxPastelInkOptions>): Promise<any>;
  export function createWorkflowFromFrontmatter(frontmatter: WorkflowFrontmatter): any;
  
  export const WorkflowManager: React.FC<any>;
  export const landingPageComponents: Record<string, React.ComponentType<any>>;
}
