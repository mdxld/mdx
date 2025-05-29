import { describe, it, expect } from 'vitest'
import { parseJSDoc } from './jsdoc-parser'

describe('parseJSDoc', () => {
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
    const result = parseJSDoc(code)
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
    const result = parseJSDoc(code)
    expect(result.valid).toBe(true)
    expect(result.parsed).toHaveLength(0)
  })
})
