import { generateText } from 'ai'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

interface CodeOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  language?: string
  framework?: string
  style?: 'functional' | 'object-oriented' | 'procedural'
}

async function codeCore(prompt: string, options: CodeOptions = {}): Promise<string> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const {
    language = 'typescript',
    framework,
    style = 'functional'
  } = options

  let systemPrompt = `You are an expert ${language} developer. Generate clean, well-structured ${style} code.`
  
  if (framework) {
    systemPrompt += ` Use ${framework} framework conventions and best practices.`
  }

  const result = await generateText({
    model: aiModel(selectedModel),
    system: systemPrompt,
    prompt: `Generate ${language} code for: ${prompt}`,
  })
  
  return result.text
}

export const code = createUnifiedFunction<Promise<string>>(
  (prompt: string, options: Record<string, any>) => {
    return codeCore(prompt, options as CodeOptions);
  }
);
