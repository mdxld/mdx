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
        `import { defineConfig } from 'velite'
    
export default defineConfig({
  output: {
    data: './.velite',
    assets: './public/static',
    base: '/static/'
  },
  collections: {
    posts: {
      name: 'Post',
      pattern: 'content/posts/**/*.mdx',
      schema: {
        title: { type: 'string', required: true },
        date: { type: 'date', required: true },
        body: { type: 'mdx', required: true }
      }
    },
    blog: {
      name: 'Blog',
      pattern: 'content/blog/**/*.mdx',
      schema: {
        title: { type: 'string', required: true },
        date: { type: 'date', required: true },
        body: { type: 'mdx', required: true }
      }
    },
    pages: {
      name: 'Page',
      pattern: 'content/pages/**/*.mdx',
      schema: {
        title: { type: 'string', required: true },
        body: { type: 'mdx', required: true }
      }
    }
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

/**
 * Helper function to simulate a Velite build by directly creating JSON files
 * This avoids the need to run the actual Velite CLI while still testing real file system operations
 */
export async function simulateVeliteBuild(testDir: string): Promise<void> {
  const postsDir = path.join(testDir, 'content/posts')
  const blogDir = path.join(testDir, 'content/blog')
  const outputDir = path.join(testDir, '.velite')

  await Promise.all([
    fs.mkdir(outputDir, { recursive: true }), 
    fs.mkdir(postsDir, { recursive: true }), 
    fs.mkdir(blogDir, { recursive: true })
  ])

  const veliteConfigPath = path.join(testDir, 'velite.config.js')
  const configContent = `
    module.exports = {
      root: '${testDir}',
      collections: {
        blog: {
          pattern: 'content/blog/**/*.mdx',
          schema: {
            title: { type: 'string', required: true },
            date: { type: 'date', required: false },
            body: { type: 'mdx', required: true }
          }
        },
        posts: {
          pattern: 'content/posts/**/*.mdx',
          schema: {
            title: { type: 'string', required: true },
            date: { type: 'date', required: false },
            body: { type: 'mdx', required: true }
          }
        },
      }
    };
  `

  await fs.writeFile(veliteConfigPath, configContent)
  
  // Process both directories in parallel
  const [posts, blogPosts] = await Promise.all([
    processDirectory(postsDir),
    processDirectory(blogDir),
  ])

  // Ensure output directory still exists before writing JSON files
  await fs.mkdir(outputDir, { recursive: true })
  
  try {
    await fs.writeFile(path.join(outputDir, 'posts.json'), JSON.stringify(posts))
    console.log('Created posts.json successfully')
  } catch (error) {
    console.error('Error creating posts.json:', error)
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(path.join(outputDir, 'posts.json'), '[]')
    console.log('Created empty posts.json as fallback')
  }
  
  try {
    await fs.writeFile(path.join(outputDir, 'blog.json'), JSON.stringify(blogPosts))
    console.log('Created blog.json successfully')
  } catch (error) {
    console.error('Error creating blog.json:', error)
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(path.join(outputDir, 'blog.json'), '[]')
    console.log('Created empty blog.json as fallback')
  }
}

/**
 * Process all MDX files in a directory
 */
async function processDirectory(dir: string): Promise<any[]> {
  const results = []

  try {
    const files = await fs.readdir(dir)

    for (const file of files) {
      if (file.endsWith('.mdx')) {
        const filePath = path.join(dir, file)
        const content = await fs.readFile(filePath, 'utf-8')

        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
        if (match) {
          const frontmatterText = match[1]
          const body = match[2].trim()

          const frontmatter: Record<string, any> = {}
          frontmatterText.split('\n').forEach((line) => {
            const [key, ...valueParts] = line.split(':')
            if (key && valueParts.length) {
              frontmatter[key.trim()] = valueParts.join(':').trim()
            }
          })

          results.push({
            slug: path.basename(file, '.mdx'),
            ...frontmatter,
            body,
          })
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error)
  }

  return results
}

/**
 * Check if a directory exists
 */
async function dirExists(dir: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dir)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}
