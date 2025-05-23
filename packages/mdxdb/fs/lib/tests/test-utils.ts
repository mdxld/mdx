import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import os from 'os'

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
This is the content of post 1.`,
  )

  await fs.writeFile(
    path.join(contentDir, 'post-2.mdx'),
    `---
title: Sample Post 2
date: 2023-01-02
---
# Sample Post 2
This is the content of post 2.`,
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
    `,
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
    cleanup,
  }
}
