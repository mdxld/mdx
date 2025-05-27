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
  it('should let you call a function that accepts and returns an object', async () => {
    const result = await ai.leanCanvas({ company: 'Vercel' })
    console.log(result)
    expect(typeof result).toBe('object')
    expect(Object.keys(result).length).toBeGreaterThan(0)
  })

  // TODO: Test that the function creates a new file in the .ai/functions directory
  // TODO: Test that existing .ai/functions files are not overwritten
  // TODO: Test that .ai/functions file frontmatter `output` schema and `model` are honored
})