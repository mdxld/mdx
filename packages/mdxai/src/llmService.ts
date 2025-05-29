import { CoreMessage, StreamTextResult, streamText, generateText, experimental_createMCPClient, wrapLanguageModel, experimental_generateImage as generateImage } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai' // Added createOpenAI
import { createCacheMiddleware } from './cacheMiddleware'
import { createAIModel } from './ai'

const cacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  persistentCache: true,
  memoryCache: true,
})

interface LLMServiceParams {
  modelProvider?: typeof openai // Changed to typeof openai
  modelId?: string
  messages: CoreMessage[]
  apiKey?: string
  baseURL?: string
}

export async function generateContentStream(params: LLMServiceParams): Promise<StreamTextResult<never, string>> {
  // Changed to StreamTextResult<never, string>
  const {
    modelProvider = openai, // Default to imported openai instance
    modelId = 'google/gemini-2.5-flash-preview-05-20', // Default model
    messages,
  } = params

  try {
    // The modelProvider is already an initialized OpenAI client if it's the default 'openai'
    // If a different provider instance is passed, it should also be pre-initialized.
    // The modelId is used to specify which model to use with that provider.
    // const model = modelProvider(modelId as any) // The 'as any' cast is to satisfy the generic signature of OpenAI

    const aiModel = createAIModel(params.apiKey, params.baseURL)
    const wrappedModel = wrapLanguageModel({
      model: aiModel(params.modelId || 'google/gemini-2.5-flash-preview-05-20', { structuredOutputs: true }),
      middleware: cacheMiddleware,
    })

    const result = await streamText({
      model: wrappedModel,
      messages: messages,
    })
    return result
  } catch (error) {
    console.error('Error calling LLM service:', error)
    throw error // Re-throwing to be caught by CLI command handlers
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
  return createOpenAI({
    baseURL: baseURL,
    apiKey: apiKey || process.env.AI_GATEWAY_TOKEN,
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
  const wrappedModel = wrapLanguageModel({
    model: model,
    middleware: cacheMiddleware,
  })

  // Use streamText directly with the wrapped model
  const result = await streamText({
    model: wrappedModel,
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

  const model = openai('o4-mini')
  const wrappedModel = wrapLanguageModel({
    model: model,
    middleware: cacheMiddleware,
  })

  const result = await streamText({
    model: wrappedModel,
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
