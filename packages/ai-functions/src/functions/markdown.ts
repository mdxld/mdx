import { generateText } from 'ai'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

export type MarkdownResult = {
  markdown: string
  frontmatter?: Record<string, any>
}

export type MarkdownTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<MarkdownResult>

interface MarkdownOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  includeFrontmatter?: boolean
}

async function markdownCore(content: string, options: MarkdownOptions = {}): Promise<MarkdownResult> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const systemPrompt = options.includeFrontmatter 
    ? 'Generate well-structured markdown content with YAML frontmatter. Include appropriate headings, formatting, and metadata.'
    : 'Generate well-structured markdown content. Use appropriate headings, formatting, lists, and other markdown features.'

  const result = await generateText({
    model: aiModel(selectedModel),
    system: systemPrompt,
    prompt: content,
  })
  
  return {
    markdown: result.text,
    frontmatter: options.includeFrontmatter ? {} : undefined
  }
}

export const markdown = createUnifiedFunction<Promise<MarkdownResult>>(
  (content: string, options: Record<string, any>) => {
    return markdownCore(content, options as MarkdownOptions);
  }
);
