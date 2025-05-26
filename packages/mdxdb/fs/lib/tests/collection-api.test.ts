import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestFixture, TestFixture, simulateVeliteBuild } from './test-utils.js'
import { MdxDb } from '../mdxdb.js'

const TEST_TIMEOUT = 30000

describe('Collection API', () => {
  let fixture: TestFixture
  let db: any // Using any to access dynamic collection properties

  beforeEach(async () => {
    fixture = await createTestFixture()
    db = new MdxDb(fixture.testDir)
    
    Object.defineProperty(db, 'config', {
      value: {
        collections: {
          blog: {
            pattern: 'content/blog/**/*.mdx',
          },
          posts: {
            pattern: 'content/posts/**/*.mdx',
          },
        },
      },
    })
    
    await simulateVeliteBuild(fixture.testDir)
    await db.build()
  })

  afterEach(async () => {
    await fixture.cleanup()
  })

  it('should create a blog post using collection API', async () => {
    const testFixture = await createTestFixture()
    const testDb = new MdxDb(testFixture.testDir)
    
    Object.defineProperty(testDb, 'config', {
      value: {
        collections: {
          blog: {
            pattern: 'content/blog/**/*.mdx',
          },
          posts: {
            pattern: 'content/posts/**/*.mdx',
          },
        },
      },
    })
    
    await simulateVeliteBuild(testFixture.testDir)
    await testDb.build()
    
    const title = 'My First Blog Post'
    const content = 'This is the content of my first blog post.'

    await testDb.blog.create(title, content)
    
    await simulateVeliteBuild(testFixture.testDir)
    await testDb.build()
    
    const blogPosts = testDb.blog.list()
    expect(blogPosts).toBeDefined()
    expect(blogPosts.length).toBeGreaterThan(0)

    const createdPost = blogPosts.find((post: any) => post.title === title)
    expect(createdPost).toBeDefined()
    expect(createdPost.title).toBe(title)
    expect(createdPost.body).toBe(content)
    
    await testFixture.cleanup()
  }, TEST_TIMEOUT)

  it('should get a blog post by slug using collection API', async () => {
    const title = 'Test Post'
    const content = 'Test content'

    await db.blog.create(title, content)
    
    await simulateVeliteBuild(fixture.testDir)
    await db.build()

    const retrievedPost = db.blog.get('test-post')
    expect(retrievedPost).toBeDefined()
    expect(retrievedPost.title).toBe(title)
    expect(retrievedPost.body.trim()).toBe(content)
  }, TEST_TIMEOUT)

  it('should update a blog post using collection API', async () => {
    const originalTitle = 'Original Title'
    const originalContent = 'Original content'
    const updatedTitle = 'Updated Title'
    const updatedContent = 'Updated content'

    await db.blog.create(originalTitle, originalContent)
    
    await simulateVeliteBuild(fixture.testDir)
    await db.build()
    
    await db.blog.update('original-title', updatedTitle, updatedContent)
    
    await simulateVeliteBuild(fixture.testDir)
    await db.build()

    const updatedPost = db.blog.get('original-title')
    expect(updatedPost).toBeDefined()
    expect(updatedPost.title).toBe(updatedTitle)
    expect(updatedPost.body.trim()).toBe(updatedContent)
  }, TEST_TIMEOUT)

  it('should delete a blog post using collection API', async () => {
    const title = 'Post to Delete'
    const content = 'This post will be deleted'

    await db.blog.create(title, content)
    
    await simulateVeliteBuild(fixture.testDir)
    await db.build()
    
    const deleteResult = await db.blog.delete('post-to-delete')
    expect(deleteResult).toBe(true)
    
    await simulateVeliteBuild(fixture.testDir)
    await db.build()

    const deletedPost = db.blog.get('post-to-delete')
    expect(deletedPost).toBeUndefined()
  }, TEST_TIMEOUT)

  it('should maintain backward compatibility with existing API', async () => {
    await db.build()
    
    const allPosts = db.list('posts')
    expect(Array.isArray(allPosts)).toBe(true)

    const specificPost = db.get('post-1', 'posts')
    expect(specificPost).toBeDefined()
    
    const allBlogPosts = db.list('blog')
    expect(Array.isArray(allBlogPosts)).toBe(true)
    
    const sampleBlog = db.get('sample-blog', 'blog')
    expect(sampleBlog).toBeDefined()
  }, TEST_TIMEOUT)
})
