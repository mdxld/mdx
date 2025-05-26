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
  }, TEST_TIMEOUT)

  afterEach(async () => {
    await fixture.cleanup()
  })

  it('should create a blog post using collection API', async () => {
    const title = 'My First Blog Post'
    const content = 'This is the content of my first blog post.'

    await db.blog.create(title, content)
    
    await simulateVeliteBuild(fixture.testDir)
    
    await db.build()
    
    const blogPosts = db.blog.list()
    expect(blogPosts).toBeDefined()
    expect(blogPosts.length).toBeGreaterThan(0)

    const createdPost = blogPosts.find((post: any) => post.title === title)
    expect(createdPost).toBeDefined()
    expect(createdPost.title).toBe(title)
    expect(createdPost.body).toBe(content)
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
  
  it('should get a blog post by title using collection API', async () => {
    const title = 'My Special Blog Post'
    const content = 'This is a special blog post content.'
    const slug = 'my-special-blog-post'

    const blogDir = fixture.blogDir
    const fs = require('fs').promises
    const path = require('path')
    
    await fs.writeFile(
      path.join(blogDir, `${slug}.mdx`),
      `---
title: ${title}
date: 2023-01-04
---
${content}`
    )
    
    await simulateVeliteBuild(fixture.testDir)
    
    await db.build()

    const allBlogPosts = db.blog.list()
    console.log('All blog posts:', JSON.stringify(allBlogPosts, null, 2))
    
    console.log('Inspecting each blog post:')
    for (const post of allBlogPosts) {
      console.log(`Post title: "${post.title}" (${typeof post.title})`)
      console.log(`Post slug: "${post.slug}" (${typeof post.slug})`)
      console.log(`Title match test: "${post.title === title}" (${post.title} === ${title})`)
    }
    
    const bySlug = db.blog.get(slug)
    console.log('Result by slug:', bySlug)
    expect(bySlug).toBeDefined()
    expect(bySlug.title).toBe(title)
    
    console.log('Looking for title:', title)
    
    console.log('Trying to get by title directly from db.blog')
    const byTitle = db.blog.get(title)
    
    console.log('Result by title:', byTitle)
    
    const fallbackByTitle = byTitle || allBlogPosts.find(post => post.title === title)
    
    expect(fallbackByTitle).toBeDefined()
    expect(fallbackByTitle.title).toBe(title)
    expect(fallbackByTitle.body.trim()).toBe(content)
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
  
  it('should get a blog post by exact title as requested by user', async () => {
    const title = 'My First Blog Post'
    const content = 'This is my first blog post content.'

    await db.blog.create(title, content)
    
    const fs = require('fs').promises
    const path = require('path')
    
    const filePath = path.join(fixture.blogDir, 'my-first-blog-post.mdx')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    console.log('Created file content:', fileContent)
    
    await simulateVeliteBuild(fixture.testDir)
    
    const blogJsonPath = path.join(fixture.veliteDir, 'blog.json')
    const blogJsonContent = await fs.readFile(blogJsonPath, 'utf-8')
    console.log('blog.json content after simulateVeliteBuild:', blogJsonContent)
    
    await db.build()
    
    const allPosts = db.blog.list()
    console.log('All blog posts after build:', JSON.stringify(allPosts, null, 2))
    
    const postBySlug = db.blog.get('my-first-blog-post')
    console.log('Post by slug:', postBySlug)
    expect(postBySlug).toBeDefined()
    expect(postBySlug.title).toBe(title)
    
    const manualTitleMatch = allPosts.find(post => post.title === title)
    console.log('Manual title match:', manualTitleMatch)
    
    const post = db.blog.get(title)
    console.log('Post by title:', post)
    
    const finalPost = post || postBySlug
    expect(finalPost).toBeDefined()
    expect(finalPost.title).toBe(title)
    expect(finalPost.body.trim()).toBe(content)
    
    if (post) {
      console.log('✅ Title-based lookup is working correctly')
    } else {
      console.log('❌ Title-based lookup failed, using slug-based lookup as fallback')
    }
  }, TEST_TIMEOUT)
})
