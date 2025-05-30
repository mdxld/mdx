// This file can be used to export core functionalities if the package is also intended to be used as a library.

import { CoreMessage, StreamTextResult } from 'ai'
import { openai } from '@ai-sdk/openai'
import { generateContentStream, generateListStream, generateResearchStream, generateDeepwikiStream, generateImageStream } from './llmService.js'

export interface GenerateOptions {
  type?: 'title' | 'outline' | 'draft'
  modelProvider?: typeof openai
  modelId?: string
  apiKey?: string
  baseURL?: string
}

export { generateContentStream, generateListStream, generateResearchStream, generateDeepwikiStream, generateImageStream }
export { createCacheMiddleware, CacheConfig } from './cacheMiddleware.js'
export { ai, research, generateAiText, executeAiFunction, inferAndValidateOutput, TemplateFn, ResearchTemplateFn, list, ListFunction, say, SayTemplateFn, image, ImageTemplateFn } from './aiHandler.js'
export { extract } from './functions/extract.js'
export { video, VideoConfig, VideoResult } from './functions/video.js'
export { scrape, scrapeMultiple, ScrapedContent } from './functions/scrape.js'
export { 
  plan, 
  parseTaskLists, 
  serializeTaskItem, 
  serializeTaskList, 
  serializeTaskLists, 
  serializePlanResult,
  TaskItem, 
  TaskList, 
  PlanResult 
} from './functions/plan.js'

export {
  createAiFolderStructure,
  writeAiFunction,
  findAiFunctionsInHierarchy,
  findAiFunctionEnhanced,
  ensureAiFunctionExists,
  createAiFunctionVersion,
  listAiFunctionVersions,
  AI_FOLDER_STRUCTURE,
} from './utils.js'

/**
 * Generate markdown/MDX content based on a prompt.
 *
 * @param prompt - The text prompt to generate content from
 * @param options - Configuration options
 * @returns A Promise with the generated content as string and the streaming content
 */
export async function generate(prompt: string, options: GenerateOptions = {}) {

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
    apiKey: options.apiKey,
    baseURL: options.baseURL
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
