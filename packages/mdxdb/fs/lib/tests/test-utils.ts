import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import os from 'os'

const execFilePromise = promisify(execFile)

export interface TestFixture {
  testDir: string
  contentDir: string
  blogDir: string
  veliteDir: string
  exportDir: string
  cleanup: () => Promise<void>
}

/**
 * Creates a temporary test directory structure for file system tests
 */
export async function createTestFixture(): Promise<TestFixture> {
  try {
    const timestamp = Date.now()
    const testDir = path.resolve(os.tmpdir(), `mdxdb-fs-test-${timestamp}`)

    const contentDir = path.join(testDir, 'content/posts')
    const blogDir = path.join(testDir, 'content/blog')
    const veliteDir = path.join(testDir, '.velite')
    const exportDir = path.join(testDir, 'export')

    await Promise.all([
      fs.mkdir(contentDir, { recursive: true }),
      fs.mkdir(blogDir, { recursive: true }),
      fs.mkdir(veliteDir, { recursive: true }),
      fs.mkdir(exportDir, { recursive: true }),
    ])

    console.log(`Created test directories at ${testDir}`)

    await Promise.all([
      fs.writeFile(
        path.join(contentDir, 'post-1.mdx'),
        `---
title: Sample Post 1
date: 2023-01-01
---
# Sample Post 1
This is the content of post 1.`,
      ),
      fs.writeFile(
        path.join(contentDir, 'post-2.mdx'),
        `---
title: Sample Post 2
date: 2023-01-02
---
# Sample Post 2
This is the content of post 2.`,
      ),
      fs.writeFile(
        path.join(blogDir, 'sample-blog.mdx'),
        `---
title: Sample Blog
date: 2023-01-03
---
# Sample Blog
This is a sample blog post.`,
      ),
      fs.writeFile(
        path.join(testDir, 'velite.config.ts'),
        `import { defineConfig, s } from 'velite'

export default defineConfig({
  collections: {
    blog: {
      name: 'blog',
      pattern: 'content/blog/**/*.mdx',
      schema: s
        .object({
          title: s.string(),
          date: s.isodate().optional(),
          body: s.mdx()
        })
        .transform((data) => ({ ...data, slug: data.title.toLowerCase().replace(/\\s+/g, '-') }))
    },
    posts: {
      name: 'posts', 
      pattern: 'content/posts/**/*.mdx',
      schema: s
        .object({
          title: s.string(),
          date: s.isodate().optional(),
          body: s.mdx()
        })
        .transform((data) => ({ ...data, slug: data.title.toLowerCase().replace(/\\s+/g, '-') }))
    }
  },
  output: {
    data: './.velite'
  }
})`,
      ),

      fs.writeFile(
        path.join(veliteDir, 'posts.json'),
        JSON.stringify([
          {
            slug: 'post-1',
            title: 'Sample Post 1',
            date: '2023-01-01',
            body: '# Sample Post 1\nThis is the content of post 1.',
          },
          {
            slug: 'post-2',
            title: 'Sample Post 2',
            date: '2023-01-02',
            body: '# Sample Post 2\nThis is the content of post 2.',
          },
        ]),
      ),
      fs.writeFile(
        path.join(veliteDir, 'blog.json'),
        JSON.stringify([
          {
            slug: 'sample-blog',
            title: 'Sample Blog',
            date: '2023-01-03',
            body: '# Sample Blog\nThis is a sample blog post.',
          },
        ]),
      ),
    ])

    const cleanup = async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true })
      } catch (error) {
        console.error(`Failed to clean up test directory: ${error}`)
      }
    }

    return {
      testDir,
      contentDir,
      blogDir,
      veliteDir,
      exportDir,
      cleanup,
    }
  } catch (error) {
    console.error(`Error creating test fixture: ${error}`)
    throw error
  }
}
