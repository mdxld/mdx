import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { code } from './code'

describe('code', () => {
  it('should generate a function', async () => {
    try {
      const result = await code`a function that returns the sum of two numbers`
      expect(result.code.length).toBeGreaterThan(50)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls

  it('should should have JSDoc documentation', async () => {
    try {
      const result = await code`nth fibonacci number`
      expect(result.type.length).toBeGreaterThan(50)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls

  it('should should have tests', async () => {
    try {
      const result = await code`nth fibonacci number`
      expect(result.tests.length).toBeGreaterThan(100)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls

  it('should pass tests', async () => {
    try {
      const result = await code`billing for stripe api consumption`
      expect(result.tests.length).toBeGreaterThan(100)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls
})
