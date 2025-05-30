import { generateObject } from 'ai'
import { z } from 'zod'
import { model } from '../ai'
import { parseTemplate, TemplateFunction, createUnifiedFunction } from '../utils/template'

const schema = z.object({
  props: z.string({ description: 'Typescript Type export for Props describing the props for the component.' }),
  component: z.string({ description: 'Clean, simple, and readable TypeScript React component named default function export.' }),
  stories: z.string({ description: 'Storybook Stories for the component.  Use the @storybook/react library to write stories.' }),
  // tests: z.string({ description: 'Vitest tests for normal and edge cases. The `describe`, `it`, and `expect` functions are in global scope.' }),
})

async function uiCore(description: string, options: Record<string, any> = {}): Promise<z.infer<typeof schema>> {
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

export const ui = createUnifiedFunction<Promise<z.infer<typeof schema>>>(
  (description: string, options: Record<string, any>) => {
    return uiCore(description, options);
  }
);

// /**
//  * @typedef {Object} Props
//  * @property {string} title
//  */

// /** @type {(props: Props) => JSX.Element} */
