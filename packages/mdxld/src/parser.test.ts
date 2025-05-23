import dedent from 'dedent'
import { parseFrontmatter, convertToJSONLD } from './parser'

describe('parseFrontmatter', () => {
  it('should return empty object if frontmatter is not found', () => {
    const mdxContent = dedent`
      # This is a heading

      This is some content.
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.frontmatter).toEqual({})
    expect(result.error).toBeUndefined()
  })

  it('should parse valid YAML frontmatter', () => {
    const mdxContent = dedent`
      ---
      title: My Post
      tags: ['typescript', 'yaml']
      ---

      # This is a heading
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.error).toBeUndefined()
    expect(result.frontmatter).toEqual({
      title: 'My Post',
      tags: ['typescript', 'yaml'],
    })
  })

  it('should return an error for invalid YAML syntax', () => {
    const mdxContent = dedent`
      ---
      title: My Post
      tags: [typescript, yaml
      ---

      # This is a heading
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.frontmatter).toBeNull()
    expect(result.error).toContain('MDXLD YAML Parsing Error:')
  })

  it('should return an error for frontmatter that is not a YAML object', () => {
    const expectedError = 'MDXLD Invalid Frontmatter: Frontmatter must be a YAML object (key-value pairs).'

    const testCases = [
      { name: 'string', mdxContent: dedent`
        ---
        "just a string"
        ---

        # Heading
      ` },
      { name: 'number', mdxContent: dedent`
        ---
        12345
        ---

        # Heading
      ` },
      { name: 'boolean', mdxContent: dedent`
        ---
        true
        ---

        # Heading
      ` },
      { name: 'array', mdxContent: dedent`
        ---
        - item1
        - item2
        ---

        # Heading
      ` },
    ]

    testCases.forEach((tc) => {
      const result = parseFrontmatter(tc.mdxContent)
      expect(result.frontmatter).toBeNull()
      expect(result.error).toBe(expectedError)
    })
  })

  it('should return empty object for empty frontmatter', () => {
    const mdxContent = dedent`
      ---
      ---

      # Heading
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.frontmatter).toEqual({})
    expect(result.error).toBeUndefined()
  })

  it('should handle frontmatter with no content after it', () => {
    const mdxContent = dedent`
      ---
      title: My Post
      ---
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.error).toBeUndefined()
    expect(result.frontmatter).toEqual({
      title: 'My Post',
    })
  })
})

describe('convertToJSONLD', () => {
  it('should handle empty or null input by returning an empty graph', () => {
    expect(convertToJSONLD(null)).toEqual({ '@graph': [] })
    expect(convertToJSONLD({})).toEqual({ '@graph': [] })
  })

  it('should convert frontmatter with $graph and $context', () => {
    const yamlObject = {
      $context: 'http://schema.org/',
      $graph: [
        { $id: '#thing1', $type: 'Person', name: 'Jane Doe' },
        { $id: '#thing2', $type: 'Organization', name: 'Acme Corp' },
      ],
    }
    const expected = {
      '@context': 'http://schema.org/',
      '@graph': [
        { '@id': '#thing1', '@type': 'Person', name: 'Jane Doe' },
        { '@id': '#thing2', '@type': 'Organization', name: 'Acme Corp' },
      ],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should convert frontmatter without $graph (implicit graph)', () => {
    const yamlObject = {
      $context: 'http://schema.org/',
      $id: '#product',
      $type: 'Product',
      name: 'Awesome Widget',
      description: 'The best widget ever.',
      offers: {
        $type: 'Offer',
        price: '29.99',
      },
    }
    const expected = {
      '@context': 'http://schema.org/',
      '@graph': [
        {
          '@id': '#product',
          '@type': 'Product',
          name: 'Awesome Widget',
          description: 'The best widget ever.',
          offers: {
            '@type': 'Offer',
            price: '29.99',
          },
        },
      ],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should recursively map $id and $type in nested objects and arrays', () => {
    const yamlObject = {
      $context: 'http://example.com/context',
      $id: 'root-item',
      name: 'Root Item',
      items: [
        { $id: 'item-1', $type: 'TypeA', value: 'Value A' },
        {
          $id: 'item-2',
          $type: 'TypeB',
          nested: { $id: 'nested-item-2.1', $type: 'TypeC', data: 'Data C' },
        },
      ],
      details: {
        $id: 'details-1',
        $type: 'DetailsType',
        info: 'Some details',
      },
    }
    const expected = {
      '@context': 'http://example.com/context',
      '@graph': [
        {
          '@id': 'root-item',
          name: 'Root Item',
          items: [
            { '@id': 'item-1', '@type': 'TypeA', value: 'Value A' },
            {
              '@id': 'item-2',
              '@type': 'TypeB',
              nested: { '@id': 'nested-item-2.1', '@type': 'TypeC', data: 'Data C' },
            },
          ],
          details: {
            '@id': 'details-1',
            '@type': 'DetailsType',
            info: 'Some details',
          },
        },
      ],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should handle frontmatter with only a $context', () => {
    const yamlObject = {
      $context: 'http://schema.org/',
    }
    const expectedAdjusted = {
      '@context': 'http://schema.org/',
      '@graph': [{}],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expectedAdjusted)
  })

  it('should handle frontmatter with only $graph (no $context)', () => {
    const yamlObject = {
      $graph: [{ $id: '#item1', name: 'Item 1' }],
    }
    const expected = {
      '@graph': [{ '@id': '#item1', name: 'Item 1' }],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should wrap frontmatter with no $-prefixed keys in @graph', () => {
    const yamlObject = {
      title: 'My Document',
      author: 'John Doe',
      chapters: [{ title: 'Chapter 1' }, { title: 'Chapter 2' }],
    }
    const expected = {
      '@graph': [
        {
          title: 'My Document',
          author: 'John Doe',
          chapters: [{ title: 'Chapter 1' }, { title: 'Chapter 2' }],
        },
      ],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should handle frontmatter with $graph and other keys (other keys ignored)', () => {
    const yamlObject = {
      $context: 'http://schema.org/',
      $graph: [{ $id: '#thing1', $type: 'Person', name: 'Jane Doe' }],
      title: 'This should be ignored',
      description: 'This also',
    }
    const expected = {
      '@context': 'http://schema.org/',
      '@graph': [{ '@id': '#thing1', '@type': 'Person', name: 'Jane Doe' }],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should handle $graph with non-array value (treat as implicit graph)', () => {
    const yamlObject = {
      $context: 'http://schema.org/',
      $graph: { $id: 'not-an-array', $type: 'ErrorCase', name: 'Should be wrapped' },
    }
    const expected = {
      '@context': 'http://schema.org/',
      '@graph': [
        {
          $graph: { '@id': 'not-an-array', '@type': 'ErrorCase', name: 'Should be wrapped' },
        },
      ],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should handle $context as an array of strings', () => {
    const yamlObject = {
      $context: ['http://schema.org/', 'https://example.com/custom-context.jsonld'],
      $id: '#item',
      $type: 'Product',
      name: 'Product with array context',
    }
    const expected = {
      '@context': ['http://schema.org/', 'https://example.com/custom-context.jsonld'],
      '@graph': [
        {
          '@id': '#item',
          '@type': 'Product',
          name: 'Product with array context',
        },
      ],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should handle $context as an array of objects and apply transformations', () => {
    const yamlObject = {
      $context: ['http://schema.org/', { term: 'http://example.com/term', $type: 'SpecialTerm', oldId: 'ignored' }],
      name: 'Doc with mixed context',
    }
    const expected = {
      '@context': ['http://schema.org/', { term: 'http://example.com/term', '@type': 'SpecialTerm', oldId: 'ignored' }],
      '@graph': [{ name: 'Doc with mixed context' }],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should handle $context as a complex object and apply transformations', () => {
    const yamlObject = {
      $context: {
        term1: 'http://example.com/term1',
        term2: { $id: 'http://example.com/term2', $type: '@vocab' },
      },
      name: 'Doc with object context',
    }
    const expected = {
      '@context': {
        term1: 'http://example.com/term1',
        term2: { '@id': 'http://example.com/term2', '@type': '@vocab' },
      },
      '@graph': [{ name: 'Doc with object context' }],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should handle $context as an array including complex objects', () => {
    const yamlObject = {
      $context: [
        'http://schema.org/',
        {
          ex: 'http://example.org/vocab#',
          $type: '@vocab',
          nested: {
            $id: 'nestedContextTerm',
            someProp: 'value',
          },
        },
      ],
      'ex:property': 'Some value',
      name: 'Test Document',
    }
    const expected = {
      '@context': [
        'http://schema.org/',
        {
          ex: 'http://example.org/vocab#',
          '@type': '@vocab',
          nested: {
            '@id': 'nestedContextTerm',
            someProp: 'value',
          },
        },
      ],
      '@graph': [
        {
          'ex:property': 'Some value',
          name: 'Test Document',
        },
      ],
    }
    expect(convertToJSONLD(yamlObject)).toEqual(expected)
  })

  it('should throw TypeError if $context is an invalid type (number)', () => {
    const yamlObject = {
      $context: 12345,
      name: 'Doc with invalid context',
    }
    expect(() => convertToJSONLD(yamlObject)).toThrow(new TypeError("MDXLD Invalid $context: '$context' must be a string, object, or array."))
  })

  it('should throw TypeError if $context is an invalid type (boolean)', () => {
    const yamlObject = {
      $context: true,
      name: 'Doc with invalid context',
    }
    expect(() => convertToJSONLD(yamlObject)).toThrow(new TypeError("MDXLD Invalid $context: '$context' must be a string, object, or array."))
  })
})

describe('parseFrontmatter with $-prefixed keys (JSON-LD like)', () => {
  it('should preserve $-prefixed keys at the root level', () => {
    const mdxContent = dedent`
      ---
      $context: http://schema.org/
      $type: BlogPosting
      title: My Post with JSON-LD
      author: Jane Doe
      ---
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.error).toBeUndefined()
    expect(result.frontmatter).toEqual({
      $context: 'http://schema.org/',
      $type: 'BlogPosting',
      title: 'My Post with JSON-LD',
      author: 'Jane Doe',
    })
  })

  it('should preserve $-prefixed keys in nested objects', () => {
    const mdxContent = dedent`
      ---
      title: My Post
      author:
        $type: Person
        name: John Doe
        affiliation:
          $type: Organization
          name: Example Corp
      $graph:
        - $type: Event
          name: Launch Party
      ---
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.error).toBeUndefined()
    expect(result.frontmatter).toEqual({
      title: 'My Post',
      author: {
        $type: 'Person',
        name: 'John Doe',
        affiliation: {
          $type: 'Organization',
          name: 'Example Corp',
        },
      },
      $graph: [
        {
          $type: 'Event',
          name: 'Launch Party',
        },
      ],
    })
  })

  it('should preserve $-prefixed keys within arrays of objects', () => {
    const mdxContent = dedent`
      ---
      $type: ItemList
      items:
        - $type: Product
          name: Product A
          $id: /product/a
        - $type: Product
          name: Product B
          offers:
            $type: Offer
            price: "19.99"
---
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.error).toBeUndefined()
    expect(result.frontmatter).toEqual({
      $type: 'ItemList',
      items: [
        {
          $type: 'Product',
          name: 'Product A',
          $id: '/product/a',
        },
        {
          $type: 'Product',
          name: 'Product B',
          offers: {
            $type: 'Offer',
            price: '19.99',
          },
        },
      ],
    })
  })

  it('should handle a mix of $-prefixed and non-prefixed keys in various structures', () => {
    const mdxContent = dedent`
      ---
      $context:
        name: http://schema.org/name
        description: http://schema.org/description
        image:
          $id: http://schema.org/image
          $type: "@id"
      title: Complex Data
      mainEntity:
        $id: urn:uuid:1234
        $type: CreativeWork
        name: Main Work
        relatedWork:
          - $type: Article
            name: Related Article 1
            author:
              name: Author A
              $id: mailto:author.a@example.com
          - name: Plain Related Item
      ---
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.error).toBeUndefined()
    expect(result.frontmatter).toEqual({
      $context: {
        name: 'http://schema.org/name',
        description: 'http://schema.org/description',
        image: {
          $id: 'http://schema.org/image',
          $type: '@id',
        },
      },
      title: 'Complex Data',
      mainEntity: {
        $id: 'urn:uuid:1234',
        $type: 'CreativeWork',
        name: 'Main Work',
        relatedWork: [
          {
            $type: 'Article',
            name: 'Related Article 1',
            author: {
              name: 'Author A',
              $id: 'mailto:author.a@example.com',
            },
          },
          {
            name: 'Plain Related Item',
          },
        ],
      },
    })
  })

  it('should correctly parse frontmatter with only $-prefixed keys', () => {
    const mdxContent = dedent`
      ---
      $id: /my-page
      $type: WebPage
      ---
      Content starts here.
    `
    const result = parseFrontmatter(mdxContent)
    expect(result.error).toBeUndefined()
    expect(result.frontmatter).toEqual({
      $id: '/my-page',
      $type: 'WebPage',
    })
  })
})
