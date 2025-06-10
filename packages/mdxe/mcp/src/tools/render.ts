import { render, type RenderOptions } from 'mdxld'

export interface RenderToolArgs {
  content: string
  components?: Record<string, any>
  scope?: Record<string, any>
}

export async function renderTool(args: RenderToolArgs) {
  try {
    const options: RenderOptions = {
      components: args.components || {},
      scope: args.scope || {}
    }
    
    const result = await render(args.content, options)
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            markdown: result.markdown,
            frontmatter: result.frontmatter
          }, null, 2)
        }
      ]
    }
  } catch (error) {
    throw new Error(`Failed to render MDX: ${error instanceof Error ? error.message : String(error)}`)
  }
}
