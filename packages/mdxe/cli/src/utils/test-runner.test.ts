import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import type { CodeBlock } from './mdx-parser'
import fs from 'node:fs/promises'
import { extractMdxCodeBlocks } from './mdx-parser'
import { createTempTestFile, runTestsWithVitest, cleanupTempFiles, bundleCodeForTesting } from './test-runner'
import * as util from 'node:util'
import * as childProcess from 'node:child_process'
import os from 'node:os'

const TEST_DIR = path.join(os.tmpdir(), `mdx-test-runner-${Date.now()}`)

describe('test-runner', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true })
  })
  
  afterEach(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true })
    } catch (error) {
      console.error('Error cleaning up test directory:', error)
    }
  })

  describe('bundleCodeForTesting', () => {
    it.skip('bundles code blocks for testing', async () => {
      const codeBlocks: CodeBlock[] = [
        { lang: 'typescript', meta: null, value: 'const a = 1;' },
        { lang: 'typescript', meta: null, value: 'const b = 2;' },
      ]
      const testBlocks: CodeBlock[] = [
        { lang: 'typescript', meta: 'test', value: 'test("example", () => { expect(1).toBe(1); });' },
      ]

      try {
        const result = await bundleCodeForTesting(codeBlocks, testBlocks)
  
        expect(result).toContain('const a = 1;')
        expect(result).toContain('const b = 2;')
        expect(result).toContain('test("example"')
      } catch (error) {
        console.error('Error bundling code for testing:', error)
        throw error
      }
    }, 60000) // Increase timeout for real API calls
  })

  describe('createTempTestFile', () => {
    it('creates a temporary test file from bundled code', async () => {
      const bundledCode = 'const a = 1;\nconst b = 2;\ntest("example", () => { expect(1).toBe(1); });'
      const fileName = 'example.mdx'
      
      const originalCwd = process.cwd()
      
      // Change to test directory for this test
      process.chdir(TEST_DIR)
      
      try {
        const result = await createTempTestFile(bundledCode, fileName)
        
        const fileContent = await fs.readFile(result, 'utf-8')
        expect(fileContent).toContain('const a = 1;')
        expect(fileContent).toContain('const b = 2;')
        expect(fileContent).toContain('test("example"')
        expect(result).toContain('example.test.ts')
      } finally {
        process.chdir(originalCwd)
      }
    }, 60000) // Increase timeout for real API calls
  })

  describe('runTestsWithVitest', () => {
    it('runs tests using Vitest', async () => {
      const testCode = `
        import { describe, it, expect } from 'vitest'
        
        describe('simple test', () => {
          it('passes', () => {
            expect(1).toBe(1)
          })
        })
      `
      
      const originalCwd = process.cwd()
      
      // Change to test directory for this test
      process.chdir(TEST_DIR)
      
      try {
        const testFile = await createTempTestFile(testCode, 'simple-test.mdx')
        const result = await runTestsWithVitest(testCode, 'simple-test.mdx')
        
        expect(result.success).toBe(true)
      } finally {
        process.chdir(originalCwd)
      }
    }, 60000) // Increase timeout for real API calls

    it('handles test failures', async () => {
      const testCode = `
        import { describe, it, expect } from 'vitest'
        
        describe('failing test', () => {
          it('fails', () => {
            expect(1).toBe(2)
          })
        })
      `
      
      const originalCwd = process.cwd()
      
      // Change to test directory for this test
      process.chdir(TEST_DIR)
      
      try {
        const testFile = await createTempTestFile(testCode, 'failing-test.mdx')
        const result = await runTestsWithVitest(testCode, 'failing-test.mdx')
        
        expect(result.success).toBe(false)
      } finally {
        process.chdir(originalCwd)
      }
    }, 60000) // Increase timeout for real API calls
  })

  describe('cleanupTempFiles', () => {
    it('removes temporary test files', async () => {
      const testFilePath = path.join(TEST_DIR, '.mdxe', 'test.ts')
      await fs.mkdir(path.join(TEST_DIR, '.mdxe'), { recursive: true })
      await fs.writeFile(testFilePath, 'test content', 'utf-8')
      
      const originalCwd = process.cwd()
      
      // Change to test directory for this test
      process.chdir(TEST_DIR)
      
      try {
        await cleanupTempFiles()
        
        let dirExists = true
        try {
          await fs.access(path.join(TEST_DIR, '.mdxe'))
        } catch (error) {
          dirExists = false
        }
        
        expect(dirExists).toBe(false)
      } finally {
        process.chdir(originalCwd)
      }
    }, 60000) // Increase timeout for real API calls

    it('handles errors during cleanup', async () => {
      const originalCwd = process.cwd()
      
      // Change to test directory for this test
      process.chdir(TEST_DIR)
      
      const testDir = path.join(TEST_DIR, '.mdxe')
      await fs.mkdir(testDir, { recursive: true })
      
      const errorFile = path.join(testDir, 'error-test.ts')
      await fs.writeFile(errorFile, 'test content', 'utf-8')
      
      try {
        process.chdir(testDir)
        
        await cleanupTempFiles()
        
        const stats = await fs.stat('.')
        expect(stats.isDirectory()).toBe(true)
      } finally {
        process.chdir(originalCwd)
      }
    }, 60000) // Increase timeout for real API calls
  })
})
