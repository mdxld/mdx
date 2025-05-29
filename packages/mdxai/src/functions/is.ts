import { generateObject } from 'ai'
import { model } from '../ai'
import { z } from 'zod'
import { parseTemplate, TemplateFunction } from '../utils/template'

export const is: TemplateFunction<Promise<boolean>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const question = parseTemplate(template, values)

  const result = await generateObject({
    model: model('google/gemini-2.5-flash-preview-05-20', { structuredOutputs: true }),
    prompt: `Is ${question}`,
    schema: z.object({
      thoughts: z.array(z.string()),
      answer: z.boolean(),
      confidence: z.number({ description: 'The percent confidence in the answer, between 0 and 100'}),
    }),
  })
  return result.object.answer
}