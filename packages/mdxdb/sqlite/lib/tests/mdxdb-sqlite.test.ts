import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MdxDbSqlite } from '../mdxdb-sqlite.js'
import { DocumentContent } from '@mdxdb/core'
import * as libsql from '@libsql/client'
import * as ai from 'ai'

const createClientSpy = vi.fn().mockReturnValue({})
vi.spyOn(libsql, 'createClient').mockImplementation(() => createClientSpy())

vi.mock('ai', () => ({
  ...vi.importActual('ai'),
  embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
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

  it('should search documents with vector similarity', async () => {
    const db = new MdxDbSqlite()
    await db.build()

    const content1: DocumentContent = {
      frontmatter: { title: 'Test Document 1' },
      body: 'This is a test document about artificial intelligence',
    }

    const content2: DocumentContent = {
      frontmatter: { title: 'Test Document 2' },
      body: 'This document discusses machine learning concepts',
    }

    const content3: DocumentContent = {
      frontmatter: { title: 'Test Document 3' },
      body: 'Unrelated content about gardening and plants',
    }

    await db.set('test-doc-1', content1, 'posts')
    await db.set('test-doc-2', content2, 'posts')
    await db.set('test-doc-3', content3, 'posts')

    vi.spyOn(db as any, 'cosineSimilarity').mockImplementation((vecA: any, vecB: any) => {
      return 0.85 // Return a high similarity score for testing
    })

    const results = await db.search('artificial intelligence')

    expect(results.length).toBeGreaterThan(0)

    if (results.length > 0) {
      expect(results[0]).toHaveProperty('similarity')
      expect(results[0]).toHaveProperty('slug')
      expect(results[0]).toHaveProperty('content')
      expect(results[0]).toHaveProperty('frontmatter')
    }
  })
})
