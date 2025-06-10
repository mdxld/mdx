import { generateText } from 'ai'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

interface UiOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  framework?: 'react' | 'vue' | 'svelte' | 'angular'
  styling?: 'css' | 'tailwind' | 'styled-components' | 'emotion'
  componentType?: 'functional' | 'class'
}

async function uiCore(description: string, options: UiOptions = {}): Promise<string> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const {
    framework = 'react',
    styling = 'tailwind',
    componentType = 'functional'
  } = options

  const systemPrompt = `You are an expert ${framework} developer. Generate ${componentType} components using ${styling} for styling. Follow best practices and modern patterns.`

  const result = await generateText({
    model: aiModel(selectedModel),
    system: systemPrompt,
    prompt: `Create a ${framework} component for: ${description}`,
  })
  
  return result.text
}

export const ui = createUnifiedFunction<Promise<string>>(
  (description: string, options: Record<string, any>) => {
    return uiCore(description, options as UiOptions);
  }
);
