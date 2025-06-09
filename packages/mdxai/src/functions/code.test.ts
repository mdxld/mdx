import { describe, it, expect } from 'vitest'
import { code } from './code'

describe('code', () => {
  it('should generate a function', async () => {
    const result = await code`a function that returns the sum of two numbers`
    console.log(result)
    expect(result.code.length).toBeGreaterThan(50)
  })

  it('should should have JSDoc documentation', async () => {
    const result = await code`nth fibonacci number`
    console.log(result)
    expect(result.type.length).toBeGreaterThan(50)
  })

  it('should should have tests', async () => {
    const result = await code`nth fibonacci number`
    expect(result.tests.length).toBeGreaterThan(100)
  })

  it('should pass tests', async () => {
    const result = await code`billing for stripe api consumption`
    console.log(result)
    expect(result.tests.length).toBeGreaterThan(100)
  }, 300_000)
})
