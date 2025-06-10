import { generateText } from 'ai'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

export type SayTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<string>

interface SayOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  voice?: string
  speed?: number
}

async function sayCore(text: string, options: SayOptions = {}): Promise<string> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const result = await generateText({
    model: aiModel(selectedModel),
    system: `Convert the following text to speech-friendly format. Make it natural and conversational.`,
    prompt: text,
  })
  
  return result.text
}

export const say = createUnifiedFunction<Promise<string>>(
  (text: string, options: Record<string, any>) => {
    return sayCore(text, options as SayOptions);
  }
);
