import { validateTypeScript } from './validator'

/**
 * Validate test code syntax (check if it looks like valid test code)
 */
export function validateTestSyntax(testCode: string): { valid: boolean; errors: string[] } {
  try {
    const errors: string[] = []
    
    if (!testCode.includes('describe') && !testCode.includes('it') && !testCode.includes('test')) {
      errors.push('Test code should contain describe, it, or test blocks')
    }
    
    if (!testCode.includes('expect')) {
      errors.push('Test code should contain expect assertions')
    }
    
    const tsResult = validateTypeScript(testCode)
    if (!tsResult.valid) {
      errors.push(...tsResult.errors)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Test validation error: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}
