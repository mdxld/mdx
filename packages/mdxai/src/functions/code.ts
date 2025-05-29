import { generateObject } from 'ai'
import { z } from 'zod'
import { model } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'
import { validateCodeResult, type CodeValidationResult } from './code-validator-simple'

const schema = z.object({
  functionName: z.string({ description: 'The name of the function to be exported.' }),
  description: z.string({ description: 'A detailed description of the purpose and functionality without discussing the implementation details.' }),
  type: z.string({ description: 'JSDoc comments describing the function.' }),
  tests: z.string({ description: 'Vitest tests for normal and edge cases. The `describe`, `it`, and `expect` functions are in global scope.' }),
  code: z.string({ description: 'Clean, readable, and well-documented TypeScript function export.' }),
})

export interface CodeResult extends z.infer<typeof schema> {
  validation?: CodeValidationResult
}

export const code: TemplateFunction<Promise<CodeResult>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const content = parseTemplate(template, values)

  const result = await generateObject({
    // model: model('anthropic/claude-opus-4'),
    // model: model('openai/o4-mini-high', { structuredOutputs: true}),
    model: model('google/gemini-2.5-pro-preview', { structuredOutputs: true}),
    system: `You are an expert TypeScript developer. You develop clean, readable, and clearly documented code with single quotes, no semicolons, 2 spaces indentation.`,
    prompt: `Generate a TypeScript function and tests for ${content}`,
    schema,
  })
  
  return result.object
}

/**
 * Generate and validate code with JSDoc, TypeScript, and test syntax validation
 */
export const codeWithValidation: TemplateFunction<Promise<CodeResult>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const codeResult = await code(template, ...values)
  
  // Validate the generated code
  const validation = validateCodeResult(codeResult)
  
  return {
    ...codeResult,
    validation
  }
}

export { schema }
