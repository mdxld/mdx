import { createOpenAI } from '@ai-sdk/openai'

export const model = createOpenAI({
  compatibility: 'compatible',
  apiKey: process.env.AI_GATEWAY_TOKEN,
  baseURL: process.env.AI_GATEWAY_URL || 'https://api.llm.do',
  headers: {
    'HTTP-Referer': 'https://workflows.do',
    'X-Title': 'Workflows.do Business-as-Code',
  },
})
