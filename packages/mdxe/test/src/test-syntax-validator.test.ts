import { describe, it, expect } from 'vitest'
import { validateTestSyntax } from './test-syntax-validator'

describe('validateTestSyntax', () => {
  it('should validate proper test code', () => {
    const testCode = `
describe('add function', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
  })
})
`
    const result = validateTestSyntax(testCode)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject code without test blocks', () => {
    const testCode = `
const x = 5
console.log(x)
`
    const result = validateTestSyntax(testCode)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject code without expect assertions', () => {
    const testCode = `
describe('add function', () => {
  it('should add two numbers correctly', () => {
    console.log(add(2, 3))
  })
})
`
    const result = validateTestSyntax(testCode)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject code with syntax errors', () => {
    const testCode = `
describe('add function', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5
  })
})
`
    const result = validateTestSyntax(testCode)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
