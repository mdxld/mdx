import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import type { CodeBlock } from './mdx-parser'
import fs from 'node:fs/promises'
import { extractMdxCodeBlocks } from './mdx-parser'
import { createTempTestFile, runTestsWithVitest, cleanupTempFiles, bundleCodeForTesting } from './test-runner'
import * as util from 'node:util'
import { exec } from 'node:child_process'
import * as esbuild from 'esbuild'
import os from 'node:os'

const execAsync = util.promisify(exec)
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
    it('bundles code blocks for testing', async () => {
      const codeBlocks: CodeBlock[] = [
        { lang: 'typescript', meta: null, value: 'const a = 1;' },
        { lang: 'typescript', meta: null, value: 'const b = 2;' },
      ]
      const testBlocks: CodeBlock[] = [
        { lang: 'typescript', meta: 'test', value: 'test("example", () => { expect(1).toBe(1); });' },
      ]

      const result = await bundleCodeForTesting(codeBlocks, testBlocks)

      expect(result).toContain('const a = 1;')
      expect(result).toContain('const b = 2;')
      expect(result).toContain('test("example"')
    })
  })

  describe('createTempTestFile', () => {
    it('creates a temporary test file from bundled code', async () => {
      const bundledCode = 'const a = 1;\nconst b = 2;\ntest("example", () => { expect(1).toBe(1); });'
      const fileName = 'example.mdx'
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
      try {
        const result = await createTempTestFile(bundledCode, fileName)
        
        const fileContent = await fs.readFile(result, 'utf-8')
        expect(fileContent).toContain('const a = 1;')
        expect(fileContent).toContain('const b = 2;')
        expect(fileContent).toContain('test("example"')
        expect(result).toContain('example.test.ts')
      } finally {
        process.cwd = originalCwd
      }
    })
  })

  describe('runTestsWithVitest', () => {
    let execAsyncSpy: any
    
    beforeEach(() => {
      execAsyncSpy = vi.spyOn(util, 'promisify').mockImplementation(() => {
        return () => Promise.resolve({ stdout: 'Test passed', stderr: '' })
      })
    })
    
    afterEach(() => {
      execAsyncSpy.mockRestore()
    })
    
    it('runs tests using Vitest', async () => {
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
      try {
        const result = await runTestsWithVitest(bundledCode, filePath)
        
        expect(result.success).toBe(true)
        expect(result.output).toContain('Test passed')
      } finally {
        process.cwd = originalCwd
      }
    })

    it('handles test failures', async () => {
      execAsyncSpy.mockImplementation(() => {
        return () => Promise.resolve({ stdout: 'FAIL Test failed', stderr: '' })
      })
      
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
      try {
        const result = await runTestsWithVitest(bundledCode, filePath)
        
        expect(result.success).toBe(false)
        expect(result.output).toContain('FAIL')
      } finally {
        process.cwd = originalCwd
      }
    })

    it('supports watch mode', async () => {
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
      try {
        await runTestsWithVitest(bundledCode, filePath, true)
        
      } finally {
        process.cwd = originalCwd
      }
    })

    it('handles execution errors', async () => {
      const error = new Error('Command failed') as any
      error.stdout = 'Error stdout'
      error.stderr = 'Error stderr'
      
      execAsyncSpy.mockImplementation(() => {
        return () => Promise.reject(error)
      })
      
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
      try {
        const result = await runTestsWithVitest(bundledCode, filePath)
        
        expect(result.success).toBe(false)
        expect(result.output).toContain('Error stdout')
      } finally {
        process.cwd = originalCwd
      }
    })
    
    it('processes bundled code and creates temporary test files', async () => {
      const bundledCode = 'test("example", () => {});'
      const filePath = 'test.mdx'
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
      try {
        const result = await runTestsWithVitest(bundledCode, filePath)
        
        expect(result.success).toBe(true)
      } finally {
        process.cwd = originalCwd
      }
    })
  })

  describe('cleanupTempFiles', () => {
    it('removes temporary test files', async () => {
      const testFilePath = path.join(TEST_DIR, '.mdxe', 'test.ts')
      await fs.mkdir(path.join(TEST_DIR, '.mdxe'), { recursive: true })
      await fs.writeFile(testFilePath, 'test content', 'utf-8')
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
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
        process.cwd = originalCwd
      }
    })

    it('handles errors during cleanup', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const rmSpy = vi.spyOn(fs, 'rm').mockRejectedValueOnce(new Error('Cleanup failed'))
      
      const originalCwd = process.cwd
      process.cwd = vi.fn().mockReturnValue(TEST_DIR)
      
      try {
        await cleanupTempFiles()
        
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error cleaning up temporary files:'),
          expect.any(Error)
        )
      } finally {
        process.cwd = originalCwd
        consoleErrorSpy.mockRestore()
        rmSpy.mockRestore()
      }
    })
  })
})
