import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import os from 'os'

interface MdxDbConfig {
  packageDir?: string
  veliteConfig?: any
  collections?: Record<string, any>
}

const execFilePromise = promisify(execFile)

export interface TestFixture {
  testDir: string
  contentDir: string
  veliteDir: string
  exportDir: string
  cleanup: () => Promise<void>
}

/**
 * Creates a temporary test directory structure for file system tests
 */
export async function createTestFixture(): Promise<TestFixture> {
  const timestamp = Date.now()
  const testDir = path.resolve(os.tmpdir(), `mdxdb-fs-test-${timestamp}`)
  
  const contentDir = path.join(testDir, 'content/posts')
  const veliteDir = path.join(testDir, '.velite')
  const exportDir = path.join(testDir, 'export')
  
  await fs.mkdir(contentDir, { recursive: true })
  await fs.mkdir(veliteDir, { recursive: true })
  await fs.mkdir(exportDir, { recursive: true })
  
  await fs.writeFile(
    path.join(contentDir, 'post-1.mdx'),
    `---
title: Sample Post 1
date: 2023-01-01
---
# Sample Post 1
This is the content of post 1.`
  )
  
  await fs.writeFile(
    path.join(contentDir, 'post-2.mdx'),
    `---
title: Sample Post 2
date: 2023-01-02
---
# Sample Post 2
This is the content of post 2.`
  )
  
  await fs.writeFile(
    path.join(veliteDir, 'posts.json'),
    JSON.stringify([
      { slug: 'post-1', title: 'Sample Post 1', date: '2023-01-01', body: '# Sample Post 1\nThis is the content of post 1.' },
      { slug: 'post-2', title: 'Sample Post 2', date: '2023-01-02', body: '# Sample Post 2\nThis is the content of post 2.' }
    ])
  )
  
  await fs.writeFile(
    path.join(veliteDir, 'pages.json'),
    JSON.stringify([
      { slug: 'page-1', title: 'Page 1', body: 'Content 1' },
      { slug: 'page-2', title: 'Page 2', body: 'Content 2' }
    ])
  )
  
  await fs.writeFile(
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
    pages: {
      name: 'Page',
      pattern: 'content/pages/**/*.mdx',
      schema: {
        title: { type: 'string', required: true },
        body: { type: 'mdx', required: true }
      }
    }
  }
})
    `
  )
  
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
    veliteDir,
    exportDir,
    cleanup
  }
}

/**
 * Mock implementation for the Velite build process
 * This avoids actually running the Velite CLI while still testing the MdxDbFs functionality
 */
export async function mockVeliteBuild(config: MdxDbConfig): Promise<void> {
  const sourceDir = path.join(config.packageDir as string, 'content/posts')
  const outputDir = path.join(config.packageDir as string, '.velite')
  
  await fs.mkdir(outputDir, { recursive: true })
  
  const files = await fs.readdir(sourceDir)
  const posts: Array<Record<string, any>> = []
  
  for (const file of files) {
    if (file.endsWith('.mdx')) {
      const filePath = path.join(sourceDir, file)
      const content = await fs.readFile(filePath, 'utf-8')
      
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (match) {
        const frontmatterText = match[1]
        const body = match[2]
        
        const frontmatter: Record<string, any> = {}
        frontmatterText.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':')
          if (key && valueParts.length) {
            frontmatter[key.trim()] = valueParts.join(':').trim()
          }
        })
        
        posts.push({
          slug: path.basename(file, '.mdx'),
          ...frontmatter,
          body
        })
      }
    }
  }
  
  await fs.writeFile(
    path.join(outputDir, 'posts.json'),
    JSON.stringify(posts)
  )
}
