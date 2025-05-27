import { describe, it, expect } from 'vitest'
import { research } from 'mdxai'

describe('research', () => {
  it('should interpolate a string', async () => {
    const company = 'Vercel'
    const result = await research`the origin story of ${company}`
    expect(result).toBe('Paris')
  })
}, 300_000)