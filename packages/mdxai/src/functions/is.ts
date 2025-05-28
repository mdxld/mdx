import { generateObject } from 'ai'
import { model } from '../ai'
import { z } from 'zod'
import { parseTemplate, TemplateFunction } from '../utils/template'

export const is: TemplateFunction<Promise<boolean>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const question = parseTemplate(template, values)

  const result = await generateObject({
    model: model('google/gemini-2.5-flash-preview-05-20'),
    prompt: `Is ${question}`,
    schema: z.object({
      answer: z.boolean(),
    }),
  })
  return result.object.answer
}