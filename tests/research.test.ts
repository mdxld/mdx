import { describe, it, expect } from 'vitest'
import { research } from 'mdxai'

describe('research', () => {
  const company = 'Vercel'
  
  it('should interpolate a string', async () => {
    const result = await research`the origin story of ${company}`
    expect(result.text).toContain(company)
  }, 300_000)
  
  it('should return citations', async () => {
    const result = await research`the origin story of ${company}`
    expect(result.citations).toBeDefined()
  }, 300_000)
})
