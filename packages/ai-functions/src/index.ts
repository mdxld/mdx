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

export { ai, generateAiText, type AiFunction, type TemplateFn } from './functions/ai.js'
export { list, type ListFunction } from './functions/list.js'
export { research, type ResearchTemplateFn, type ResearchResult } from './functions/research.js'
export { extract } from './functions/extract.js'
export { is } from './functions/is.js'
export { say, type SayTemplateFn } from './functions/say.js'
export { image, type ImageTemplateFn } from './functions/image.js'
export { markdown, type MarkdownTemplateFn, type MarkdownResult } from './functions/markdown.js'
export { video, type VideoConfig, type VideoResult } from './functions/video.js'
export { code } from './functions/code.js'
export { deepwiki } from './functions/deepwiki.js'
export { mdx } from './functions/mdx.js'
export { 
  plan, 
  parseTaskLists, 
  serializeTaskItem, 
  serializeTaskList, 
  serializeTaskLists, 
  serializePlanResult,
  type TaskItem, 
  type TaskList, 
  type PlanResult 
} from './functions/plan.js'
export { scope } from './functions/scope.js'
export { ui } from './functions/ui.js'
export { workflow } from './functions/workflow.js'
export { prompt, type PromptTemplateFn, type PromptResult, type PromptOptions } from './functions/prompt.js'

export { parseTemplate, stringifyValue, type TemplateFunction, createUnifiedFunction } from './utils/template.js'
export { createZodSchemaFromObject, inferAndValidateOutput } from './utils/ai-execution.js'
export { handleStringOutput, handleArrayOutput, handleObjectOutput } from './utils/output-handlers.js'

export { scrape, scrapeMultiple, type ScrapedContent } from './functions/scrape.js'

export { createAIModel, model } from './ai.js'

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
