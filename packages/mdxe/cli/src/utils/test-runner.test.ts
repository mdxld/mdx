import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:fs/promises', async () => {
  const mockFunctions = {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    rm: vi.fn().mockResolvedValue(undefined)
  }
  return {
    default: mockFunctions,
    ...mockFunctions
  }
})

vi.mock('node:child_process', () => ({
  exec: vi.fn()
}))

vi.mock('node:util', () => {
  const mockExecAsync = vi.fn().mockResolvedValue({ stdout: 'Test passed', stderr: '' })
  return {
    promisify: vi.fn().mockReturnValue(mockExecAsync)
  }
})

vi.mock('./mdx-parser', () => ({
  extractMdxCodeBlocks: vi.fn().mockResolvedValue({ testBlocks: [], codeBlocks: [] })
}))

vi.mock('esbuild', () => ({
  transform: vi.fn().mockResolvedValue({ code: 'const a = 1;\nconst b = 2;\ntest("example", () => {});' })
}))

import path from 'node:path'
import type { CodeBlock } from './mdx-parser'
import fs from 'node:fs/promises'
import { extractMdxCodeBlocks } from './mdx-parser'
import { createTempTestFile, runTestsWithVitest, cleanupTempFiles, bundleCodeForTesting } from './test-runner'
import * as util from 'node:util'
import { exec } from 'node:child_process'

const mockExecAsync = vi.mocked(util.promisify)(exec) as ReturnType<typeof vi.fn>

describe('test-runner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(fs.rm).mockResolvedValue(undefined)
    vi.mocked(extractMdxCodeBlocks).mockResolvedValue({ 
      testBlocks: [], 
      codeBlocks: [] 
    })
    
    mockExecAsync.mockResolvedValue({ stdout: 'Test passed', stderr: '' })
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

      const result = await createTempTestFile(bundledCode, fileName)

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('.mdxe'), { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('example.test.ts'),
        expect.stringContaining('const a = 1;'),
        'utf-8'
      )
      expect(result).toContain('example.test.ts')
    })
  })

  describe('runTestsWithVitest', () => {
    it('runs tests using Vitest', async () => {
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      const result = await runTestsWithVitest(bundledCode, filePath)

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('npx vitest run --globals')
      )
      expect(result.success).toBe(true)
      expect(result.output).toContain('Test passed')
    })

    it('handles test failures', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'FAIL Test failed', stderr: '' })
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      
      const result = await runTestsWithVitest(bundledCode, filePath)

      expect(result.success).toBe(false)
      expect(result.output).toContain('FAIL')
    })

    it('supports watch mode', async () => {
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      
      await runTestsWithVitest(bundledCode, filePath, true)

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('--watch')
      )
    })

    it('handles execution errors', async () => {
      const error = new Error('Command failed') as any
      error.stdout = 'Error stdout'
      error.stderr = 'Error stderr'
      
      mockExecAsync.mockRejectedValue(error)
      
      const bundledCode = 'const test = () => {}'
      const filePath = 'test1.ts'
      
      const result = await runTestsWithVitest(bundledCode, filePath)

      expect(result.success).toBe(false)
      expect(result.output).toContain('Error stdout')
    })
    
    it('processes bundled code and creates temporary test files', async () => {
      const bundledCode = 'test("example", () => {});'
      const filePath = 'test.mdx'
      
      const result = await runTestsWithVitest(bundledCode, filePath)
      
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('npx vitest run')
      )
      expect(result.success).toBe(true)
    })
  })

  describe('cleanupTempFiles', () => {
    it('removes temporary test files', async () => {
      await cleanupTempFiles()

      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('.mdxe'),
        { recursive: true, force: true }
      )
    })

    it('handles errors during cleanup', async () => {
      vi.mocked(fs.rm).mockRejectedValue(new Error('Cleanup failed'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await cleanupTempFiles()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error cleaning up temporary files:'),
        expect.any(Error)
      )
      
      consoleErrorSpy.mockRestore()
    })
  })
})
