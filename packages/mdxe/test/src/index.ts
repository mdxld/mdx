import { validateTypeScript } from './validator'
import { parseJSDoc } from './jsdoc-parser'
import { bundleCodeForTesting, runTestsWithVitest, CodeBlock } from './test-runner'
import { validateTestSyntax } from './test-syntax-validator'

/**
 * Result of code validation, matching the expected CodeValidationResult structure
 */
export interface ValidationResult {
  jsdoc: {
    valid: boolean;
    errors: string[];
    parsed?: any;
  };
  typescript: {
    valid: boolean;
    errors: string[];
    diagnostics?: any;
  };
  syntax: {
    valid: boolean;
    errors: string[];
  };
}

/**
 * Validate code with TypeScript, JSDoc, and optionally run tests
 */
export async function validateCode(
  code: string,
  tests?: string,
  options?: { runTests?: boolean }
): Promise<ValidationResult> {
  const tsValidation = validateTypeScript(code)
  
  const jsdocValidation = parseJSDoc(code)
  
  let syntaxValidation: { valid: boolean; errors: string[] }
  if (tests) {
    syntaxValidation = validateTestSyntax(tests)
  } else {
    syntaxValidation = { valid: true, errors: [] }
  }
  
  let testResult: { success: boolean; output: string; skipped?: number } | undefined = undefined
  if (options?.runTests && tests) {
    const codeBlock: CodeBlock = { lang: 'ts', meta: null, value: code }
    const testBlock: CodeBlock = { lang: 'ts', meta: null, value: tests }
    
    const bundledCode = await bundleCodeForTesting([codeBlock], [testBlock])
    testResult = await runTestsWithVitest(bundledCode, 'temp.ts')
  }
  
  return {
    jsdoc: jsdocValidation,
    typescript: {
      valid: tsValidation.valid,
      errors: tsValidation.errors,
      diagnostics: tsValidation.diagnostics
    },
    syntax: syntaxValidation
  }
}

export { validateTypeScript } from './validator'
export { parseJSDoc } from './jsdoc-parser'
export { validateTestSyntax } from './test-syntax-validator'
export { bundleCodeForTesting, runTestsWithVitest } from './test-runner'
export type { CodeBlock } from './test-runner'
