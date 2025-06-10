import { ai, executeAiFunction } from 'mdxai'

export interface AiToolArgs {
  prompt: string
  functionName?: string
}

export async function aiTool(args: AiToolArgs) {
  try {
    let result: string
    
    if (args.functionName) {
      result = await executeAiFunction(args.functionName, args.prompt)
    } else {
      result = await ai(args.prompt)
    }
    
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
