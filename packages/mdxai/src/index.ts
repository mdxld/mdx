// This file can be used to export core functionalities if the package is also intended to be used as a library.

import { CoreMessage, StreamTextResult } from 'ai'
import { openai } from '@ai-sdk/openai'
import { generateContentStream, generateListStream, generateResearchStream, generateDeepwikiStream } from './llmService.js'

export interface GenerateOptions {
  type?: 'title' | 'outline' | 'draft'
  modelProvider?: typeof openai
  modelId?: string
}

export { generateContentStream, generateListStream, generateResearchStream, generateDeepwikiStream }
export { ai, executeAiFunction, TemplateFn } from './aiHandler.js'

/**
 * Generate markdown/MDX content based on a prompt.
 *
 * @param prompt - The text prompt to generate content from
 * @param options - Configuration options
 * @returns A Promise with the generated content as string and the streaming content
 */
export async function generate(prompt: string, options: GenerateOptions = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set.')
  }

  let systemMessage: string
  switch (options.type?.toLowerCase() || 'draft') {
    case 'title':
      systemMessage = 'You are an expert copywriter. Generate a compelling blog post title based on the following topic.'
      break
    case 'outline':
      systemMessage = 'You are a content strategist. Generate a blog post outline based on the following topic/prompt.'
      break
    case 'draft':
    default:
      systemMessage = 'You are a helpful AI assistant. Generate a Markdown draft based on the following prompt.'
      break
  }

  const messages: CoreMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt },
  ]

  const result = await generateContentStream({
    messages,
    modelProvider: options.modelProvider,
    modelId: options.modelId,
  })

  return {
    textStream: result.textStream,
    text: async () => {
      let content = ''
      for await (const chunk of result.textStream) {
        content += chunk
      }
      return content
    },
  }
}
