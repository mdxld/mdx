import { generateText, experimental_createMCPClient } from 'ai'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

interface DeepwikiOptions {
  apiKey?: string
  baseURL?: string
  model?: string
}

async function deepwikiCore(query: string, options: DeepwikiOptions = {}): Promise<string> {
  const selectedModel = options.model || 'o4-mini'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  try {
    const client = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: 'https://mcp.deepwiki.com/sse',
      },
    })

    const tools = await client.tools()

    const result = await generateText({
      model: aiModel(selectedModel),
      tools,
      messages: [
        {
          role: 'user',
          content: `research ${query}`,
        },
      ],
    })

    return result.text
  } catch (error) {
    console.error('Error in deepwiki research:', error)
    throw new Error('Failed to perform deepwiki research')
  }
}

export const deepwiki = createUnifiedFunction<Promise<string>>(
  (query: string, options: Record<string, any>) => {
    return deepwikiCore(query, options as DeepwikiOptions);
  }
);
