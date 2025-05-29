import { describe, it, expect } from 'vitest'
import { validateJSDoc, validateTypeScript, runVitestFromString, validateCodeResult } from './code-validator'

describe('Code Validator', () => {
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

    it('should catch TypeScript errors', () => {
      const code = `
export function add(a: number, b: number): number {
  return a + b + c // 'c' is not defined
}
`
      const result = validateTypeScript(code)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('runVitestFromString', () => {
    it('should run passing tests', async () => {
      const setupCode = `
export function add(a: number, b: number): number {
  return a + b
}
`
      const testCode = `
describe('add function', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
`
      const result = await runVitestFromString(testCode, setupCode)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch failing tests', async () => {
      const setupCode = `
export function add(a: number, b: number): number {
  return a + b
}
`
      const testCode = `
describe('add function', () => {
  it('should fail this test', () => {
    expect(add(2, 3)).toBe(6) // This will fail
  })
})
`
      const result = await runVitestFromString(testCode, setupCode)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateCodeResult', () => {
    it('should validate a complete code generation result', async () => {
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

      const result = await validateCodeResult(codeResult)
      
      expect(result.jsdoc.valid).toBe(true)
      expect(result.typescript.valid).toBe(true)
      expect(result.tests.valid).toBe(true)
    })
  })
}) 