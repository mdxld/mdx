import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MdxDbSqlite } from '../mdxdb-sqlite.js'
import { DocumentContent } from '@mdxdb/core'

vi.mock('@libsql/client', () => ({
  createClient: vi.fn().mockReturnValue({}),
}))

vi.mock('ai', () => ({
  embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}))

describe('MdxDbSqlite', () => {
  it('should initialize with default config', () => {
    const db = new MdxDbSqlite()
    expect(db).toBeDefined()
  })

  it('should build an empty database', async () => {
    const db = new MdxDbSqlite()
    const data = await db.build()
    expect(data).toBeDefined()
    expect(Object.keys(data).length).toBe(0)
  })

  it('should set and get a document', async () => {
    const db = new MdxDbSqlite()
    await db.build()

    const content: DocumentContent = {
      frontmatter: { title: 'Test Document' },
      body: 'Test content',
    }

    await db.set('test-doc', content, 'posts')

    const doc = await db.getData('test-doc', 'posts')
    expect(doc).toBeDefined()
    expect(doc?.frontmatter?.title).toBe('Test Document')
  })

  it('should delete a document', async () => {
    const db = new MdxDbSqlite()
    await db.build()

    const content: DocumentContent = {
      frontmatter: { title: 'Test Document' },
      body: 'Test content',
    }

    await db.set('test-doc', content, 'posts')
    const result = await db.delete('test-doc', 'posts')

    expect(result).toBe(true)
    expect(await db.getData('test-doc', 'posts')).toBeUndefined()
  })

  it('should search documents', async () => {
    const db = new MdxDbSqlite()
    await db.build()

    const content: DocumentContent = {
      frontmatter: { title: 'Test Document' },
      body: 'Test content',
    }

    await db.set('test-doc', content, 'posts')

    const results = await db.search('test')
    expect(results).toEqual([])
  })
})
