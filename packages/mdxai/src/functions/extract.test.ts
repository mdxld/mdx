import { describe, expect, it } from 'vitest'
import { extract } from './extract'

describe('extract', () => {
  it('should extract entities and relationships', async () => {
    const result = await extract`facts: ${'John Doe is a software engineer at Microsoft. He lives in New York.'}`
    expect(result.entities.length).toBeGreaterThan(0)
    expect(result.entities[0].observations.length).toBeGreaterThan(0)
    expect(result.relationships.length).toBeGreaterThan(0)
  })
})