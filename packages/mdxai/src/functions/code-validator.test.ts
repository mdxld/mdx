import { describe, it, expect } from 'vitest'
import { validateCodeResult } from './code-validator'
import { validateTypeScript, parseJSDoc, validateTestSyntax } from '@mdxe/test'

describe('Code Validator', () => {
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