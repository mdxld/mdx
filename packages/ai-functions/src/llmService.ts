import { CoreMessage, StreamTextResult, streamText, generateText, experimental_createMCPClient, wrapLanguageModel, experimental_generateImage as generateImage } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { createAIModel } from './ai.js'

interface LLMServiceParams {
  modelProvider?: typeof openai
  modelId?: string
  messages: CoreMessage[]
  apiKey?: string
  baseURL?: string
}

export async function generateContentStream(params: LLMServiceParams): Promise<StreamTextResult<never, string>> {
  const {
    modelProvider = openai,
    modelId = 'google/gemini-2.5-flash-preview-05-20',
    messages,
  } = params

  try {
    const aiModel = createAIModel(params.apiKey, params.baseURL)
    const model = aiModel(params.modelId || 'google/gemini-2.5-flash-preview-05-20', { structuredOutputs: true })

    const result = await streamText({
      model: model,
      messages: messages,
    })
    return result
  } catch (error) {
    console.error('Error calling LLM service:', error)
    throw error
  }
}

export async function generateListStream(prompt: string): Promise<StreamTextResult<never, string>> {
  const systemMessage = 'Respond with a numbered markdown ordered list'

  const messages: CoreMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt },
  ]

  return generateContentStream({ messages })
}

export function createResearchProvider(apiKey?: string, baseURL: string = 'https://api.llm.do') {
  const finalApiKey = apiKey || process.env.AI_GATEWAY_TOKEN
  if (!finalApiKey) {
    throw new Error('AI_GATEWAY_TOKEN must be provided via apiKey parameter or AI_GATEWAY_TOKEN environment variable.')
  }
  
  return createOpenAI({
    baseURL: baseURL,
    apiKey: finalApiKey,
  })
}

export async function generateResearchStream(prompt: string, apiKey?: string, baseURL?: string): Promise<StreamTextResult<never, string>> {
  const systemMessage =
    'Respond with thorough research including citations and references. Be comprehensive and include multiple perspectives when appropriate.'

  const messages: CoreMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt },
  ]

  const researchProvider = createResearchProvider(apiKey, baseURL)

  const model = researchProvider('perplexity/sonar-deep-research' as any)

  const result = await streamText({
    model: model,
    messages: messages,
  })

  return result
}

export async function generateDeepwikiStream(query: string, apiKey?: string): Promise<StreamTextResult<never, string>> {
  const client = await experimental_createMCPClient({
    transport: {
      type: 'sse',
      url: 'https://mcp.deepwiki.com/sse',
    },
  })

  const tools = await client.tools()

  const aiModel = createAIModel(apiKey)
  const model = aiModel('o4-mini')

  const result = await streamText({
    model: model,
    tools,
    messages: [
      {
        role: 'user',
        content: `research ${query}`,
      },
    ],
  })

  return result
}

export async function generateImageStream(prompt: string, options: any = {}) {
  const {
    model = 'gpt-image-1',
    quality = 'high',
    ...otherOptions
  } = options

  try {
    const result = await generateImage({
      model: openai.image(model as any),
      prompt: prompt,
      providerOptions: {
        openai: { quality },
      },
      ...otherOptions
    })

    return result
  } catch (error) {
    console.error('Error calling image generation service:', error)
    throw error
  }
}
