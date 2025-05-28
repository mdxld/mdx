import { generateObject } from 'ai'
import { z } from 'zod'
import { model } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'

const schema = z.object({
  type: z.string({ description: 'JSDoc comments describing the function.' }),
  code: z.string({ description: 'Clean, readable, and well-documented TypeScript function export.' }),
  tests: z.string({ description: 'Vitest tests for normal and edge cases. The `describe`, `it`, and `expect` functions are in global scope.' }),
})

export const code: TemplateFunction<Promise<z.infer<typeof schema>>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const content = parseTemplate(template, values)

  const result = await generateObject({
    model: model('anthropic/claude-opus-4'),
    system: `You are an expert TypeScript developer. You develop clean, readable, and clearly documented code with single quotes, no semicolons, 2 spaces indentation.`,
    prompt: `Generate a TypeScript function and tests for ${content}`,
    schema,
  })
  return result.object
}
