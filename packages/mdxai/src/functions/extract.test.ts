import { describe, expect, it } from 'vitest'
import { extract } from './extract'

describe('extract', () => {
  it('should extract entities and relationships', async () => {
    const result = await extract`facts: ${'John Doe is an amazing software engineer at Microsoft. He lives and works at the office in New York City.'}`
    expect(result.entities.length).toBeGreaterThan(0)
    expect(result.entities[0].observations.length).toBeGreaterThan(0)
    expect(result.relationships.length).toBeGreaterThan(0)
    expect(result).toMatchInlineSnapshot(`
      {
        "entities": [
          {
            "name": "John Doe",
            "observations": [
              "amazing software engineer",
              "lives and works at the office in New York City",
            ],
            "type": "Person",
          },
          {
            "name": "Microsoft",
            "observations": [
              "office in New York City",
            ],
            "type": "Organization",
          },
          {
            "name": "New York City",
            "observations": [],
            "type": "Location",
          },
        ],
        "relationships": [
          {
            "from": "John Doe",
            "to": "Microsoft",
            "type": "works at",
          },
          {
            "from": "John Doe",
            "to": "New York City",
            "type": "lives in",
          },
          {
            "from": "John Doe",
            "to": "New York City",
            "type": "works in",
          },
        ],
      }
    `)
  })

})