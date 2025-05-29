import { describe, it, expect } from 'vitest'
import { validateTypeScript } from './validator'

describe('validateTypeScript', () => {
  it('should validate correct TypeScript code', () => {
    const code = `
export function add(a: number, b: number): number {
  return a + b
}
`
    const result = validateTypeScript(code)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.estree).toBeDefined()
  })

  it('should catch syntax errors', () => {
    const code = `
export function add(a: number, b: number): number {
  return a + b + // incomplete expression
}
`
    const result = validateTypeScript(code)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.estree).toBeUndefined()
  })
})
