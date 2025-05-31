import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '../ai'
import { parseTemplate, TemplateFunction, createUnifiedFunction } from '../utils/template'

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
  const aiModel = getModel()

  const result = await generateObject({
    model: aiModel(selectedModel),
    system: `You are an expert in extracting entities and relationships from unstructured content.`,
    prompt: `Extract ${content}`,
    schema,
  })
  
  return result.object
}

export const extract = createUnifiedFunction<Promise<z.infer<typeof schema>>>(
  (content: string, options: Record<string, any>) => {
    return extractCore(content, options as ExtractOptions);
  }
);
