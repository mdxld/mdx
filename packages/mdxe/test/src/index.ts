import { validateTypeScript } from './validator'
import { parseJSDoc } from './jsdoc-parser'
import { bundleCodeForTesting, runTestsWithVitest, CodeBlock } from './test-runner'

export interface ValidationResult {
  valid: boolean;
  error?: string;
  estree?: any;
  jsdoc?: {
    valid: boolean;
    errors: string[];
    parsed?: any;
  };
  tests?: {
    success: boolean;
    output: string;
    skipped?: number;
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
  const validationResult = validateTypeScript(code)
  
  let jsdocResult: { valid: boolean; errors: string[]; parsed?: any } | undefined = undefined
  if (validationResult.valid) {
    jsdocResult = parseJSDoc(code)
  }
  
  let testResult: { success: boolean; output: string; skipped?: number } | undefined = undefined
  if (options?.runTests && tests) {
    const codeBlock: CodeBlock = { lang: 'ts', meta: null, value: code }
    const testBlock: CodeBlock = { lang: 'ts', meta: null, value: tests }
    
    const bundledCode = await bundleCodeForTesting([codeBlock], [testBlock])
    testResult = await runTestsWithVitest(bundledCode, 'temp.ts')
  }
  
  return {
    ...validationResult,
    jsdoc: jsdocResult,
    tests: testResult
  }
}

export { validateTypeScript } from './validator'
export { parseJSDoc } from './jsdoc-parser'
export { bundleCodeForTesting, runTestsWithVitest } from './test-runner'
export type { CodeBlock } from './test-runner'
