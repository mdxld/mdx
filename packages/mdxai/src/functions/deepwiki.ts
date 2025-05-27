import { experimental_createMCPClient as createMCPClient, generateText } from 'ai'
import { model } from '../ai'

export const deepwiki = async (prompt: string) => {
  const mcpClient = await createMCPClient({
    transport: {
      type: 'sse',
      url: 'https://mcp.deepwiki.com/sse',
    },
  })

  const deepwikiTools = await mcpClient.tools()

  console.log(deepwikiTools)
  console.log(deepwikiTools.read_wiki_structure)

  const result = await generateText({
    model: model('openai/gpt-4.1'),
    system: 'Use the deepwiki tools to get current information about github repos',
    tools: deepwikiTools,
    toolChoice: 'required',
    prompt,
  })

  return result.text
}
