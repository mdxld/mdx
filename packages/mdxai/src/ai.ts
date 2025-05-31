import { createOpenAI } from '@ai-sdk/openai'

export function createAIModel(apiKey?: string, baseURL?: string) {
  const resolvedApiKey = apiKey || process.env.AI_GATEWAY_TOKEN || process.env.OPENAI_API_KEY
  
  if (!resolvedApiKey) {
    throw new Error('API key is required. Set AI_GATEWAY_TOKEN or OPENAI_API_KEY environment variable.')
  }
  
  return createOpenAI({
    compatibility: 'compatible',
    apiKey: resolvedApiKey,
    baseURL: baseURL || process.env.AI_GATEWAY_URL || 'https://api.llm.do',
    headers: {
      'HTTP-Referer': 'https://workflows.do',
      'X-Title': 'Workflows.do Business-as-Code',
    },
  })
}

export const model = createAIModel()
