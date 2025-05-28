import { generateObject } from 'ai'
import { z } from 'zod'
import { model } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'

const schema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    type: z.string(),
    observations: z.array(z.string()),
  })),
  relationships: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.string(),
  })),
})

export const extract: TemplateFunction<Promise<z.infer<typeof schema>>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const content = parseTemplate(template, values)

  const result = await generateObject({
    model: model('google/gemini-2.5-flash-preview-05-20'),
    system: `You are an expert in extracting entities and relationships from unstructured text.`,
    prompt: `Extract ${content}`,
    schema,
  })
  return result.object
}
