import { describe, it, expect } from 'vitest'
import { code } from './code'

describe('code', () => {
  it('should return true if the question is true', async () => {
    const result = await code`a function that returns the sum of two numbers`
    expect(result).toBe('function sum(a: number, b: number): number { return a + b }')
  })

  it('should return false if the question is false', async () => {
    const result = await code`a function that returns the sum of two numbers`
    expect(result).toBe('function sum(a: number, b: number): number { return a + b }')
  })
})