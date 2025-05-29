import { createOpenAI } from '@ai-sdk/openai'

export function createAIModel(apiKey?: string, baseURL?: string) {
  return createOpenAI({
    compatibility: 'compatible',
    apiKey: apiKey || process.env.AI_GATEWAY_TOKEN,
    baseURL: baseURL || process.env.AI_GATEWAY_URL || 'https://api.llm.do',
    headers: {
      'HTTP-Referer': 'https://workflows.do',
      'X-Title': 'Workflows.do Business-as-Code',
    },
  })
}

export const model = createAIModel()
