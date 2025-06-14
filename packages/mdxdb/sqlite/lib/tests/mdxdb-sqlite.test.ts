import { describe, it, expect, beforeEach } from 'vitest'
import { MdxDbSqlite } from '../mdxdb-sqlite.js'
import { DocumentContent } from '@mdxdb/core'
import * as libsql from '@libsql/client'
import * as ai from 'ai'

describe('MdxDbSqlite', () => {
  const testDbPath = ':memory:'

  beforeEach(async () => {
    // Ensure the in-memory database is initialized via libsql
    const client = libsql.createClient({ url: testDbPath })
    await client.execute('SELECT 1')
    await client.close()
  })

  it('should initialize with default config', () => {
    const db = new MdxDbSqlite({ url: testDbPath })
    expect(db).toBeDefined()
  })

  it('should build an empty database', async () => {
    const db = new MdxDbSqlite({ url: testDbPath })
    const data = await db.build()
    expect(data).toBeDefined()
    expect(Object.keys(data).length).toBe(0)
  })

  it('should set and get a document', async () => {
    const db = new MdxDbSqlite({ url: testDbPath })
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
    const db = new MdxDbSqlite({ url: testDbPath })
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
    const db = new MdxDbSqlite({ url: testDbPath })
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

    await expect(db.search('artificial intelligence')).rejects.toThrow()
  })
})
