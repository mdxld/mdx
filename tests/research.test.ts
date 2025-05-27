import { describe, it, expect } from 'vitest'
import { research } from 'mdxai'

describe('research', async () => {
  
  const company = 'Vercel'
  const result = await research`the origin story of ${company}`

  it('should interpolate a string', async () => {
    expect(result).toContain(company)
  })
  it('should return citations', async () => {
    expect(result.citations).toBeDefined()
  })
}, 300_000)