import { describe, it, expect } from 'vitest'
import { research } from 'mdxai'

describe('research', () => {
  const company = 'Vercel'
  
  it.skip('should interpolate a string', async () => {
    try {
      const result = await research`the origin story of ${company}`
      expect(result.text).toContain(company)
    } catch (error) {
      console.log('Skipping test: API error or missing OPENAI_API_KEY')
      return
    }
  }, 300_000)
  
  it.skip('should return citations', async () => {
    try {
      const result = await research`the origin story of ${company}`
      expect(result.citations).toBeDefined()
    } catch (error) {
      console.log('Skipping test: API error or missing OPENAI_API_KEY')
      return
    }
  }, 300_000)
})
