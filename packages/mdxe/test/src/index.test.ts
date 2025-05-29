import { describe, it, expect } from 'vitest'
import { validateCode } from './index'

describe('validateCode', () => {
  it('should validate TypeScript code', async () => {
    const code = `
export function add(a: number, b: number): number {
  return a + b
}
`
    const result = await validateCode(code)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.estree).toBeDefined()
  })

  it('should validate TypeScript code with JSDoc', async () => {
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
    const result = await validateCode(code)
    expect(result.valid).toBe(true)
    expect(result.jsdoc).toBeDefined()
    expect(result.jsdoc?.valid).toBe(true)
  })

  it('should validate TypeScript code with tests', async () => {
    const code = `
export function add(a: number, b: number): number {
  return a + b
}
`
    const tests = `
describe('add function', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
  })
})
`
    const result = await validateCode(code, tests, { runTests: true })
    expect(result.valid).toBe(true)
    expect(result.tests).toBeDefined()
  })
})
