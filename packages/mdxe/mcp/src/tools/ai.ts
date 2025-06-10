export interface AiToolArgs {
  prompt: string
  functionName?: string
}

export async function aiTool(args: AiToolArgs) {
  try {
    const result = `AI generated response for: ${args.prompt}`
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            result: result,
            functionName: args.functionName || 'default',
            prompt: args.prompt
          }, null, 2)
        }
      ]
    }
  } catch (error) {
    throw new Error(`Failed to generate AI content: ${error instanceof Error ? error.message : String(error)}`)
  }
}
