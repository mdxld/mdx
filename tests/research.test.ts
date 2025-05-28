import { describe, it, expect } from 'vitest'
import { research } from 'mdxai'

describe('research', () => {
  const company = 'Vercel'
  
  it('should interpolate a string', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const result = await research`the origin story of ${company}`
    expect(result.text).toBeDefined()
    expect(typeof result.text).toBe('string')
  }, 300_000)
  
  it('should return citations', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const result = await research`the origin story of ${company}`
    expect(result.citations).toBeDefined()
    expect(Array.isArray(result.citations)).toBe(true)
  }, 300_000)
})
