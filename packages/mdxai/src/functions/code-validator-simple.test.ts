import { describe, it, expect } from 'vitest'
import { validateJSDoc, validateTypeScript, validateTestSyntax, validateCodeResult, analyzeCodePatterns } from './code-validator-simple'

describe('Simple Code Validator', () => {
  describe('validateJSDoc', () => {
    it('should validate valid JSDoc comments', () => {
      const code = `
/**
 * Adds two numbers together
 * @param a First number
 * @param b Second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b
}
`
      const result = validateJSDoc(code)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.parsed).toBeDefined()
    })

    it('should handle code without JSDoc', () => {
      const code = `
export function add(a: number, b: number): number {
  return a + b
}
`
      const result = validateJSDoc(code)
      expect(result.valid).toBe(true)
      expect(result.parsed).toHaveLength(0)
    })
  })

  describe('validateTypeScript', () => {
    it('should validate correct TypeScript code', () => {
      const code = `
export function add(a: number, b: number): number {
  return a + b
}
`
      const result = validateTypeScript(code)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch syntax errors', () => {
      const code = `
export function add(a: number, b: number): number {
  return a + b + // incomplete expression
}
`
      const result = validateTypeScript(code)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateTestSyntax', () => {
    it('should validate proper test code', () => {
      const testCode = `
describe('add function', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
`
      const result = validateTestSyntax(testCode)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch missing test structure', () => {
      const testCode = `
const x = 5
console.log(x)
`
      const result = validateTestSyntax(testCode)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('analyzeCodePatterns', () => {
    it('should detect code patterns correctly', () => {
      const code = `
/**
 * A function that adds numbers
 */
export function add(a: number, b: number): number {
  return a + b
}
`
      const patterns = analyzeCodePatterns(code)
      expect(patterns.hasExports).toBe(true)
      expect(patterns.hasFunctions).toBe(true)
      expect(patterns.hasTypes).toBe(true)
      expect(patterns.hasComments).toBe(true)
    })
  })

  describe('validateCodeResult', () => {
    it('should validate a complete code generation result', () => {
      const codeResult = {
        functionName: 'add',
        description: 'Adds two numbers together',
        type: `/**
 * Adds two numbers together
 * @param a First number
 * @param b Second number
 * @returns The sum of a and b
 */`,
        code: `export function add(a: number, b: number): number {
  return a + b
}`,
        tests: `describe('add function', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
    expect(add(-1, 1)).toBe(0)
    expect(add(0, 0)).toBe(0)
  })
  
  it('should handle decimal numbers', () => {
    expect(add(1.5, 2.5)).toBe(4)
  })
})`
      }

      const result = validateCodeResult(codeResult)
      
      expect(result.jsdoc.valid).toBe(true)
      expect(result.typescript.valid).toBe(true)
      expect(result.syntax.valid).toBe(true)
    })
  })
}) 