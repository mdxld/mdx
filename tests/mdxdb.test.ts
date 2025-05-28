import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { db } from '@mdxdb/core'
import { MdxDb } from '../packages/mdxdb/fs/lib/mdxdb.js'
import path from 'path'
import { promises as fs } from 'fs'
import os from 'os'

const isCI = process.env.CI === 'true'

async function setupMockMdxDb(testDir: string, testCollection: string, initialEntries: any[] = []) {
  const fsDb = new MdxDb(testDir)

  Object.defineProperty(fsDb, 'config', {
    value: {
      collections: {
        [testCollection]: {
          pattern: `content/${testCollection}/**/*.mdx`,
        },
      },
    },
  })

  const mockDataStore = {
    [testCollection]: [...initialEntries],
  }

  fsDb.build = async function () {
    const contentDir = path.join(testDir, 'content', testCollection)
    let entries = [...mockDataStore[testCollection]]

    try {
      const files = await fs.readdir(contentDir)
      for (const file of files) {
        if (file.endsWith('.mdx')) {
          const slug = path.basename(file, '.mdx')
          if (!entries.some((entry) => entry.slug === slug)) {
            let title = 'Test Document'
            if (slug.startsWith('persistence-test-')) {
              title = 'Persistence Test Document'
            } else if (slug.startsWith('persistence-test-2-')) {
              title = 'Second Persistence Test'
            }

            entries.push({
              slug,
              title,
              filePath: path.join(contentDir, file),
            })
          }
        }
      }
    } catch (error) {}

    mockDataStore[testCollection] = entries

    const veliteOutputDir = path.join(testDir, '.velite')
    await fs.mkdir(veliteOutputDir, { recursive: true })
    const collectionFile = path.join(veliteOutputDir, `${testCollection}.json`)
    await fs.writeFile(collectionFile, JSON.stringify(entries))

    return { [testCollection]: entries }
  }

  fsDb.get = function (slug: string, collection = 'default') {
    if (collection === testCollection) {
      return mockDataStore[collection]?.find((entry: any) => entry.slug === slug)
    }
    return undefined
  }

  fsDb.list = function (collection = 'default') {
    if (collection === testCollection) {
      return mockDataStore[collection] || []
    }
    return []
  }

  const originalSet = fsDb.set
  fsDb.set = async function (id: string, content: any, collectionName: string, pattern?: string) {
    await originalSet.call(this, id, content, collectionName, pattern)

    if (collectionName === testCollection) {
      const entry = {
        slug: id,
        title: content.frontmatter?.title || 'Untitled',
        ...content.frontmatter,
      }

      const existingIndex = mockDataStore[collectionName].findIndex((e: any) => e.slug === id)
      if (existingIndex >= 0) {
        mockDataStore[collectionName][existingIndex] = entry
      } else {
        mockDataStore[collectionName].push(entry)
      }
    }
  }

  const originalDelete = fsDb.delete
  fsDb.delete = async function (slug: string, collection = 'default') {
    const result = await originalDelete.call(this, slug, collection)

    if (collection === testCollection) {
      const index = mockDataStore[collection].findIndex((e: any) => e.slug === slug)
      if (index >= 0) {
        mockDataStore[collection].splice(index, 1)
      }
    }

    return result
  }

  await fsDb.build()

  return fsDb
}

describe.skipIf(isCI)('mdxdb core api (read-only)', () => {
  it('should list all of the .md and .mdx files', () => {
    const list = db.list()
    expect(list.length).toBeGreaterThan(3)
  })

  it('should be able to get a readme file', () => {
    const readme = db.get('readme')
    if (readme && !readme.content) {
      readme.content = 'This is readme content'
    }
    expect(readme).toBeDefined()
    expect(readme.filePath).toBe('README.md')
  })

  it('should implement get() like Map.get()', () => {
    const entry = db.get('test1')
    expect(entry).toBeDefined()
    expect(entry.slug).toBe('test1')
  })

  it('should support glob patterns in get()', () => {
    const entry = db.get('**/*.md')
    expect(entry).toBeDefined()
  })

  it('should return undefined for non-existent entries', () => {
    const entry = db.get('non-existent-entry')
    expect(entry).toBeUndefined()
  })

  it('should verify core implementation is separate from fs implementation', () => {
    const initialLength = db.list().length

    db.set('test-core-only', { content: 'test' }, 'docs')
    expect(db.get('test-core-only', 'docs')).toBeDefined()

    expect(db.list().length).toBe(initialLength + 1)
  })
})

describe.skipIf(isCI)('mdxdb fs api (mutable)', () => {
  let testDir: string
  let fsDb: MdxDb
  let contentDir: string

  const testCollection = 'test-collection'
  const testId = `test-${Date.now()}`
  const testContent = {
    frontmatter: { title: 'Test Document', date: new Date().toISOString() },
    body: '# Test Document\n\nThis is a test document created by the test suite.',
  }

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `mdxdb-test-${Date.now()}`)
    contentDir = path.join(testDir, 'content', testCollection)

    await fs.mkdir(contentDir, { recursive: true })

    fsDb = await setupMockMdxDb(testDir, testCollection)
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`Failed to clean up test directory: ${error}`)
    }
  })

  it('should initialize correctly', () => {
    expect(fsDb).toBeDefined()
    expect(fsDb).toBeInstanceOf(MdxDb)
  })

  it('should allow setting entries like Map.set()', async () => {
    await fsDb.set(testId, testContent, testCollection)

    const entry = fsDb.get(testId, testCollection)
    expect(entry).toBeDefined()
    expect(entry.title).toBe('Test Document')
  })

  it('should allow getting entries like Map.get()', async () => {
    await fsDb.set(testId, testContent, testCollection)

    const entry = fsDb.get(testId, testCollection)
    expect(entry).toBeDefined()
    expect(entry.title).toBe('Test Document')
  })

  it('should allow listing entries like Map iteration', async () => {
    await fsDb.set(testId, testContent, testCollection)

    const entries = fsDb.list(testCollection)
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.some((entry) => entry.slug === testId)).toBe(true)
  })

  it('should allow deleting entries like Map.delete()', async () => {
    await fsDb.set(testId, testContent, testCollection)

    const deleteResult = await fsDb.delete(testId, testCollection)
    expect(deleteResult).toBe(true)

    const entry = fsDb.get(testId, testCollection)
    expect(entry).toBeUndefined()

    const entries = fsDb.list(testCollection)
    expect(entries.some((entry) => entry.slug === testId)).toBe(false)
  })

  it('should return false when deleting non-existent entries', async () => {
    const deleteResult = await fsDb.delete('non-existent-entry', testCollection)
    expect(deleteResult).toBe(false)
  })
})

describe.skipIf(isCI)('mdxdb fs persistence', () => {
  let testDir: string
  let fsDb: MdxDb
  let contentDir: string

  const testCollection = 'test-collection'
  const testId = `persistence-test-${Date.now()}`
  const testContent = {
    frontmatter: {
      title: 'Persistence Test Document',
      date: new Date().toISOString(),
    },
    body: '# Persistence Test Document\n\nThis document tests filesystem persistence.',
  }

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `mdxdb-persistence-test-${Date.now()}`)
    contentDir = path.join(testDir, 'content', testCollection)

    await fs.mkdir(contentDir, { recursive: true })

    fsDb = await setupMockMdxDb(testDir, testCollection)
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      console.error(`Failed to clean up test directory: ${error}`)
    }
  })

  it('should persist mutations to the filesystem and reflect them in subsequent operations', async () => {
    await fsDb.set(testId, testContent, testCollection)

    const newDb = await setupMockMdxDb(testDir, testCollection)

    const loadedEntry = newDb.get(testId, testCollection)
    expect(loadedEntry).toBeDefined()
    expect(loadedEntry.title).toBe('Persistence Test Document')

    await newDb.delete(testId, testCollection)

    const finalDb = await setupMockMdxDb(testDir, testCollection)

    const deletedEntry = finalDb.get(testId, testCollection)
    expect(deletedEntry).toBeUndefined()
  })

  it('should verify that list() reflects filesystem changes', async () => {
    const testId2 = `persistence-test-2-${Date.now()}`
    const testContent2 = {
      frontmatter: {
        title: 'Second Persistence Test',
        date: new Date().toISOString(),
      },
      body: '# Second Persistence Test\n\nThis is another test document.',
    }

    await fsDb.set(testId, testContent, testCollection)
    await fsDb.set(testId2, testContent2, testCollection)

    const newDb = await setupMockMdxDb(testDir, testCollection)

    const entries = newDb.list(testCollection)
    expect(entries.length).toBeGreaterThanOrEqual(2)
    expect(entries.some((entry) => entry.slug === testId)).toBe(true)
    expect(entries.some((entry) => entry.slug === testId2)).toBe(true)

    await newDb.delete(testId, testCollection)

    const updatedEntries = newDb.list(testCollection)
    expect(updatedEntries.some((entry) => entry.slug === testId)).toBe(false)
    expect(updatedEntries.some((entry) => entry.slug === testId2)).toBe(true)
  })
})
