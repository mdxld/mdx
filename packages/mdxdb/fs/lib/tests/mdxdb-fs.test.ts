import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { promises as fs } from 'fs'
import { createTestFixture, TestFixture } from './test-utils.js'
import { MdxDb } from '../mdxdb.js'
import { DocumentContent } from '@mdxdb/core'

const TEST_TIMEOUT = 30000

describe('MdxDb', () => {
  let fixture: TestFixture

  beforeEach(async () => {
    fixture = await createTestFixture()
  })

  afterEach(async () => {
    await fixture.cleanup()
  })

  it('should initialize with default config', () => {
    const db = new MdxDb(fixture.testDir)
    Object.defineProperty(db, 'config', {
      value: {
        collections: {
          posts: {
            pattern: 'content/posts/**/*.mdx',
          },
          pages: {
            pattern: 'content/pages/**/*.mdx',
          },
        },
      },
    })
    expect(db).toBeDefined()
  })

  it(
    'should build and load data from Velite output',
    async () => {
      const db = new MdxDb(fixture.testDir)
      Object.defineProperty(db, 'config', {
        value: {
          collections: {
            posts: {
              pattern: 'content/posts/**/*.mdx',
            },
            pages: {
              pattern: 'content/pages/**/*.mdx',
            },
          },
        },
      })

      const data = await db.build()

      expect(data).toBeDefined()
      expect(data.posts).toBeDefined()
      expect(data.posts.length).toBeGreaterThan(0)
      expect(data.posts[0].slug).toBe('post-1')
      expect(data.posts[1].slug).toBe('post-2')
    },
    TEST_TIMEOUT,
  )

  it(
    'should set a document',
    async () => {
      const db = new MdxDb(fixture.testDir)
      Object.defineProperty(db, 'config', {
        value: {
          collections: {
            posts: {
              pattern: 'content/posts/**/*.mdx',
            },
            pages: {
              pattern: 'content/pages/**/*.mdx',
            },
          },
        },
      })

      const content: DocumentContent = {
        frontmatter: { title: 'New Post', date: '2023-01-03' },
        body: '# New Post\nThis is a new post.',
      }

      await db.set('new-post', content, 'posts')

      const filePath = path.join(fixture.contentDir, 'new-post.mdx')
      const fileExists = await fs
        .stat(filePath)
        .then(() => true)
        .catch(() => false)
      expect(fileExists).toBe(true)

      const fileContent = await fs.readFile(filePath, 'utf-8')
      expect(fileContent).toContain('title: New Post')
      expect(fileContent).toContain('# New Post')
    },
    TEST_TIMEOUT,
  )

  it(
    'should delete a document',
    async () => {
      const db = new MdxDb(fixture.testDir)
      Object.defineProperty(db, 'config', {
        value: {
          collections: {
            posts: {
              pattern: 'content/posts/**/*.mdx',
            },
            pages: {
              pattern: 'content/pages/**/*.mdx',
            },
          },
        },
      })

      const filePath = path.join(fixture.contentDir, 'post-1.mdx')
      let fileExists = await fs
        .stat(filePath)
        .then(() => true)
        .catch(() => false)
      expect(fileExists).toBe(true)

      const result = await db.delete('post-1', 'posts')

      expect(result).toBe(true)
      fileExists = await fs
        .stat(filePath)
        .then(() => true)
        .catch(() => false)
      expect(fileExists).toBe(false)
    },
    TEST_TIMEOUT,
  )

  it(
    'should export database',
    async () => {
      const db = new MdxDb(fixture.testDir)
      Object.defineProperty(db, 'config', {
        value: {
          collections: {
            posts: {
              pattern: 'content/posts/**/*.mdx',
            },
            pages: {
              pattern: 'content/pages/**/*.mdx',
            },
          },
        },
      })

      await db.build()

      await db.exportDb(fixture.exportDir)

      const exportedFiles = await fs.readdir(fixture.exportDir)
      expect(exportedFiles.length).toBeGreaterThan(0)

      const postsExportPath = path.join(fixture.exportDir, 'posts.json')
      const postsExportExists = await fs
        .stat(postsExportPath)
        .then(() => true)
        .catch(() => false)

      if (postsExportExists) {
        const exportContent = await fs.readFile(postsExportPath, 'utf-8')
        expect(exportContent).toBeDefined()
        const exportData = JSON.parse(exportContent)
        expect(Array.isArray(exportData)).toBe(true)
      }
    },
    TEST_TIMEOUT,
  )

  it(
    'should handle errors when file operations fail',
    async () => {
      const db = new MdxDb(fixture.testDir)
      Object.defineProperty(db, 'config', {
        value: {
          collections: {
            posts: {
              pattern: 'content/posts/**/*.mdx',
            },
            pages: {
              pattern: 'content/pages/**/*.mdx',
            },
          },
        },
      })

      const deleteResult = await db.delete('non-existent-post', 'posts')
      expect(deleteResult).toBe(false)

      await expect(
        db.set(
          'new-post',
          {
            frontmatter: { title: 'New Post' },
            body: 'Content',
          },
          'invalid-collection',
        ),
      ).rejects.toThrow()
    },
    TEST_TIMEOUT,
  )
})
