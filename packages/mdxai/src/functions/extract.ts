import { generateObject } from 'ai'
import { z } from 'zod'
import { createAIModel } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'

const schema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    type: z.string(),
    observations: z.array(z.string()),
  })),
  relationships: z.array(z.object({
    from: z.string(),
    type: z.string(),
    to: z.string(),
  })),
})

interface ExtractOptions {
  apiKey?: string
  baseURL?: string
  model?: string
}

async function extractCore(content: string, options: ExtractOptions = {}): Promise<z.infer<typeof schema>> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const result = await generateObject({
    model: aiModel(selectedModel),
    system: `You are an expert in extracting entities and relationships from unstructured content.`,
    prompt: `Extract ${content}`,
    schema,
  })
  
  return result.object
}

export const extract: TemplateFunction<Promise<z.infer<typeof schema>>> = async (template: TemplateStringsArray | string, ...values: any[]) => {
  if (typeof template === 'string' || !('raw' in template)) {
    throw new Error('extract function must be used as a template literal tag')
  }
  
  const content = parseTemplate(template, values)
  
  let options: ExtractOptions = {}
  if (values.length > 0 && typeof values[values.length - 1] === 'object' && !(values[values.length - 1] instanceof Array)) {
    options = values.pop() as ExtractOptions
  }
  
  return extractCore(content, options)
}
