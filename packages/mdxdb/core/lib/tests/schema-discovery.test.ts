import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { discoverSchemas, SchemaDefinition, HeadingYamlPair } from '../schema-discovery'

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    promises: {
      access: vi.fn(),
      readdir: vi.fn(),
      readFile: vi.fn().mockImplementation(() => Promise.resolve(Buffer.from(''))),
      mkdir: vi.fn(),
    }
  }
})

describe('Schema Discovery', () => {
  const mockDbFolderPath = '/test/.db'

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fs.access).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('discoverSchemas', () => {
    it('should return empty array if .db folder does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'))

      const result = await discoverSchemas(mockDbFolderPath)

      expect(result).toEqual([])
      expect(fs.access).toHaveBeenCalledWith(mockDbFolderPath)
      expect(fs.readdir).not.toHaveBeenCalled()
    })

    it('should discover schemas from frontmatter in MDX files', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['schema.md', 'other.txt'] as any)
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(`---
collections:
  users:
    name: User name
    email: User email address (string)
    age: User age (number)
    isActive: Whether the user is active (bool)
    role: User role (admin | user | guest)
---

# User Schema

This file defines the user schema.
`))

      const result = await discoverSchemas(mockDbFolderPath)

      expect(result).toHaveLength(1)
      expect(result[0].collectionName).toBe('users')
      expect(result[0].source).toBe('frontmatter')
      expect(result[0].schema).toMatchObject({
        name: { type: 'string', description: 'User name' },
        email: { type: 'string', description: 'User email address' },
        age: { type: 'number', description: 'User age' },
        isActive: { type: 'boolean', description: 'Whether the user is active' },
        role: {
          type: 'enum',
          description: 'User role',
          enum: ['admin', 'user', 'guest'],
        },
      })
    })

    it('should discover schemas from YAML codeblocks under headings', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['schema.md', 'other.txt'] as any)
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(`# Product Schema

\`\`\`yaml
name: Product name
price: Product price (number)
description: Product description
inStock: Whether the product is in stock (boolean)
category: Product category (electronics | clothing | food)
\`\`\`

## Other Section

Some other content.
`))

      const result = await discoverSchemas(mockDbFolderPath)

      expect(result).toHaveLength(1)
      expect(result[0].collectionName).toBe('product-schema')
      expect(result[0].source).toBe('heading')
      expect(result[0].schema).toMatchObject({
        name: { type: 'string', description: 'Product name' },
        price: { type: 'number', description: 'Product price' },
        description: { type: 'string', description: 'Product description' },
        inStock: { type: 'boolean', description: 'Whether the product is in stock' },
        category: {
          type: 'enum',
          description: 'Product category',
          enum: ['electronics', 'clothing', 'food'],
        },
      })
    })

    it('should handle multiple schema definitions in the same file', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['schemas.md'] as any)
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(`---
collections:
  users:
    name: User name
    email: User email address (string)
---

# Product Schema

\`\`\`yaml
name: Product name
price: Product price (number)
\`\`\`

# Order Schema

\`\`\`yaml
id: Order ID
items: Order items (array)
total: Order total (number)
\`\`\`
`))

      const result = await discoverSchemas(mockDbFolderPath)

      expect(result).toHaveLength(3)

      const usersSchema = result.find((s) => s.collectionName === 'users')
      expect(usersSchema).toBeDefined()
      expect(usersSchema?.source).toBe('frontmatter')

      const productSchema = result.find((s) => s.collectionName === 'product-schema')
      expect(productSchema).toBeDefined()
      expect(productSchema?.source).toBe('heading')

      const orderSchema = result.find((s) => s.collectionName === 'order-schema')
      expect(orderSchema).toBeDefined()
      expect(orderSchema?.source).toBe('heading')
    })

    it('should handle case-insensitive type annotations', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['types.md'] as any)
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(`# Types Test

\`\`\`yaml
field1: Test field (BOOL)
field2: Test field (Number)
field3: Test field (Boolean)
field4: Test field (DATE)
\`\`\`
`))

      const result = await discoverSchemas(mockDbFolderPath)

      expect(result).toHaveLength(1)
      expect(result[0].schema).toMatchObject({
        field1: { type: 'boolean', description: 'Test field' },
        field2: { type: 'number', description: 'Test field' },
        field3: { type: 'boolean', description: 'Test field' },
        field4: { type: 'date', description: 'Test field' },
      })
    })

    it('should handle both inline and standalone enum formats', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['enums.md'] as any)
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(`# Enum Test

\`\`\`yaml
inlineEnum: Status description (active | inactive | pending)
standaloneEnum: active | inactive | pending
\`\`\`
`))

      const result = await discoverSchemas(mockDbFolderPath)

      expect(result).toHaveLength(1)
      expect(result[0].schema).toMatchObject({
        inlineEnum: {
          type: 'enum',
          description: 'Status description',
          enum: ['active', 'inactive', 'pending'],
        },
        standaloneEnum: {
          type: 'enum',
          description: '',
          enum: ['active', 'inactive', 'pending'],
        },
      })
    })

    it('should handle errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      vi.mocked(fs.readdir).mockResolvedValueOnce(['invalid.md'] as any)
      vi.mocked(fs.readFile).mockResolvedValueOnce(Buffer.from(`# Invalid Schema

\`\`\`yaml
invalid: yaml: :
\`\`\`
`))

      const result = await discoverSchemas(mockDbFolderPath)

      expect(result).toEqual([])
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })
})
