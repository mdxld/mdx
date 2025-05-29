import { z } from 'zod'
import { validateCode, ValidationResult } from '@mdxe/test'

/**
 * Result of code validation
 */
export interface CodeValidationResult {
  jsdoc: {
    valid: boolean
    errors: string[]
    parsed?: any
  }
  typescript: {
    valid: boolean
    errors: string[]
    diagnostics?: any
  }
  tests: {
    valid: boolean
    errors: string[]
    results?: any
  }
}

/**
 * Validate the complete code generation result
 */
export async function validateCodeResult(result: z.infer<typeof import('./code').schema>): Promise<CodeValidationResult> {
  // Use the new @mdxe/test package for validation
  const validationResult = await validateCode(
    result.code,
    result.tests,
    { runTests: true }
  )
  
  return {
    jsdoc: validationResult.jsdoc,
    typescript: validationResult.typescript,
    tests: {
      valid: validationResult.syntax.valid,
      errors: validationResult.syntax.errors,
      results: undefined
    }
  }
} 