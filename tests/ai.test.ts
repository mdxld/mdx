import { describe, expect, it } from 'vitest'
import { ai } from 'mdxai'

describe('ai', () => {
  it('should be defined', () => {
    expect(ai).toBeDefined()
  })
  it('should be a template literal function', async () => {
    const result = await ai`hello world`
    expect(typeof result).toBe('string')
  })
  it('should do variable interpolation', async () => {
    const name = 'world'
    const result = await ai`hello ${name}`
    expect(typeof result).toBe('string')
  })
})