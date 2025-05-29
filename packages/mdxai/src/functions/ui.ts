import { generateObject } from 'ai'
import { z } from 'zod'
import { model } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'

const schema = z.object({
  props: z.string({ description: 'JSDoc comments describing the props for the component.' }),
  component: z.string({ description: 'Clean, readable, and well-documented TypeScript component export.' }),
  tests: z.string({ description: 'Vitest tests for normal and edge cases. The `describe`, `it`, and `expect` functions are in global scope.' }),
})

export const ui: TemplateFunction<Promise<z.infer<typeof schema>>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const description = parseTemplate(template, values)

  const result = await generateObject({
    // model: model('anthropic/claude-opus-4'),
    // model: model('openai/o4-mini-high', { structuredOutputs: true}),
    model: model('google/gemini-2.5-pro-preview', { structuredOutputs: true}),
    system: `You are an expert TypeScript & React developer. You develop clean, readable, and clearly documented code with Tailwind CSS, Shadcn UI, single quotes (including in JSX), no semicolons, 2 spaces indentation.`,
    prompt: `Generate a TypeScript React component:  ${description}`,
    schema,
  })
  return result.object
}
