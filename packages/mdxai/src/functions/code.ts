import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '../ai'
import { parseTemplate, TemplateFunction, createUnifiedFunction } from '../utils/template'
import { validateCode, type ValidationResult } from '@mdxe/test'

const schema = z.object({
  functionName: z.string({ description: 'The name of the function to be exported.' }),
  description: z.string({ description: 'A detailed description of the purpose and functionality without discussing the implementation details.' }),
  type: z.string({ description: 'JSDoc comments describing the function.' }),
  tests: z.string({ description: 'Vitest tests for normal and edge cases. The `describe`, `it`, and `expect` functions are in global scope.' }),
  code: z.string({ description: 'Clean, readable, and well-documented TypeScript function export.' }),
})

export interface CodeResult extends z.infer<typeof schema> {
  validation?: ValidationResult
}

async function codeCore(content: string, options: Record<string, any> = {}): Promise<CodeResult> {
  const result = await generateObject({
    // model: model('anthropic/claude-opus-4'),
    // model: model('openai/o4-mini-high', { structuredOutputs: true}),
    model: getModel()('google/gemini-2.5-pro-preview', { structuredOutputs: true}),
    system: `You are an expert TypeScript developer. You develop clean, readable, and clearly documented code with single quotes, no semicolons, 2 spaces indentation.`,
    prompt: `Generate a TypeScript function and tests for ${content}`,
    schema,
  })
  
  return result.object
}

export const code = createUnifiedFunction<Promise<CodeResult>>(
  (content: string, options: Record<string, any>) => {
    return codeCore(content, options);
  }
);

/**
 * Generate and validate code with JSDoc, TypeScript, and test syntax validation
 */
export const codeWithValidation = createUnifiedFunction<Promise<CodeResult>>(
  async (content: string, options: Record<string, any>) => {
    const codeResult = await code(content, options);
    
    // Validate the generated code using the new @mdxe/test package
    const validation = await validateCode(
      codeResult.code,
      codeResult.tests,
      { runTests: true }
    );
    
    return {
      ...codeResult,
      validation
    };
  }
);

export { schema }
