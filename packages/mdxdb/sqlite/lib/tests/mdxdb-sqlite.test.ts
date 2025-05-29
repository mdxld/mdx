import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MdxDbSqlite } from '../mdxdb-sqlite.js'
import { DocumentContent } from '@mdxdb/core'
import * as libsql from '@libsql/client'
import * as ai from 'ai'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import os from 'os'

describe('MdxDbSqlite', () => {
  let testDbPath: string

  beforeEach(async () => {
    // Create a unique database file for each test in the temp directory
    const tmpDir = os.tmpdir()
    const dbFileName = `.test-db-${randomUUID()}.db`
    testDbPath = `file:${path.join(tmpDir, dbFileName)}`
  })

  afterEach(async () => {
    // Clean up the test database file and related SQLite files
    const dbFilePath = testDbPath.replace('file:', '')
    try {
      await fs.unlink(dbFilePath)
    } catch (error) {
      // Ignore error if file doesn't exist
    }
    try {
      await fs.unlink(dbFilePath + '-wal')
    } catch (error) {
      // Ignore error if file doesn't exist
    }
    try {
      await fs.unlink(dbFilePath + '-shm')
    } catch (error) {
      // Ignore error if file doesn't exist
    }
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

  // TODO: Fix these tests - getting SQLITE_READONLY_DBMOVED error
  // This appears to be an issue with how libsql handles file URLs in the test environment
  // The tests work with the build operation but fail on write operations
  it.skip('should set and get a document', async () => {
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

  it.skip('should delete a document', async () => {
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

  it.skip('should search documents with vector similarity', async () => {
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
