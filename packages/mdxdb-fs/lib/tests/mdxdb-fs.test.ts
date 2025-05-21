import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MdxDbFs } from '../mdxdb-fs.js'
import { DocumentContent } from '@mdxdb/core'
import { promises as fs } from 'fs'
import path from 'path'

vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    copyFile: vi.fn()
  }
}))

vi.mock('child_process', () => ({
  execFile: vi.fn().mockImplementation((file, args, options, callback) => {
    if (callback) {
      callback(null, { stdout: 'mocked stdout', stderr: '' })
    }
    return { stdout: 'mocked stdout', stderr: '' }
  }),
  spawn: vi.fn(),
  ChildProcess: class {}
}))

vi.mock('util', () => {
  const mockPromisify = vi.fn().mockImplementation((fn) => {
    return (...args) => {
      return Promise.resolve({ stdout: 'mocked stdout', stderr: '' })
    }
  })
  return {
    promisify: mockPromisify,
    default: {
      promisify: mockPromisify
    }
  }
})

describe('MdxDbFs', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    vi.mocked(fs.readdir).mockImplementation((path: string, options?: any) => {
      if (options && options.withFileTypes) {
        return Promise.resolve([
          { name: 'posts.json', isDirectory: () => false },
          { name: 'pages.json', isDirectory: () => false },
          { name: 'test-dir', isDirectory: () => true }
        ] as any)
      }
      return Promise.resolve(['posts.json', 'pages.json'] as any)
    })
    
    vi.mocked(fs.readFile).mockImplementation((path: any) => {
      if (path.toString().includes('posts.json')) {
        return Promise.resolve(JSON.stringify([
          { slug: 'post-1', title: 'Post 1', body: 'Content 1' },
          { slug: 'post-2', title: 'Post 2', body: 'Content 2' }
        ]))
      }
      if (path.toString().includes('pages.json')) {
        return Promise.resolve(JSON.stringify([
          { slug: 'page-1', title: 'Page 1', body: 'Content 1' },
          { slug: 'page-2', title: 'Page 2', body: 'Content 2' }
        ]))
      }
      return Promise.resolve('{}')
    })
    
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    
    vi.mocked(fs.unlink).mockResolvedValue(undefined)
    
    vi.mocked(fs.access).mockResolvedValue(undefined)
    
    vi.mocked(fs.stat).mockImplementation((path: string) => {
      const isDir = path.includes('test-dir') || path.endsWith('.velite')
      return Promise.resolve({ 
        isDirectory: () => isDir
      } as any)
    })
    
    vi.mocked(fs.copyFile).mockResolvedValue(undefined)
  })

  it('should initialize with default config', () => {
    const db = new MdxDbFs()
    expect(db).toBeDefined()
  })

  it('should build and load data from Velite output', async () => {
    const db = new MdxDbFs({
      packageDir: '/test',
      collections: {
        posts: {
          contentDir: 'content/posts',
          pattern: 'content/posts/**/*.mdx'
        }
      }
    })
    
    const data = await db.build()
    
    expect(data).toBeDefined()
    expect(data.posts).toHaveLength(2)
    expect(data.pages).toHaveLength(2)
  })

  it('should set a document', async () => {
    const db = new MdxDbFs({
      packageDir: '/test',
      collections: {
        posts: {
          contentDir: 'content/posts',
          pattern: 'content/posts/**/*.mdx'
        }
      }
    })
    
    const content: DocumentContent = {
      frontmatter: { title: 'New Post' },
      body: 'New content'
    }
    
    await db.set('new-post', content, 'posts')
    
    expect(fs.mkdir).toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalled()
  })

  it('should delete a document', async () => {
    const db = new MdxDbFs({
      packageDir: '/test',
      collections: {
        posts: {
          contentDir: 'content/posts',
          pattern: 'content/posts/**/*.mdx'
        }
      }
    })
    
    const result = await db.delete('post-1', 'posts')
    
    expect(result).toBe(true)
    expect(fs.unlink).toHaveBeenCalled()
  })

  it('should export database', async () => {
    const db = new MdxDbFs({
      packageDir: '/test'
    })
    
    await db.exportDb('/export')
    
    expect(fs.access).toHaveBeenCalled()
    expect(fs.mkdir).toHaveBeenCalled()
    expect(fs.stat).toHaveBeenCalled()
  })
})
