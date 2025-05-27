import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTempTestFile, cleanupTempFiles } from './test-runner'
import fs from 'node:fs/promises'
import path from 'node:path'

// Mock fs module
vi.mock('node:fs/promises')

describe('test-runner', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(fs.rm).mockResolvedValue(undefined)
  })

  describe('createTempTestFile', () => {
    it('creates a temporary test file from code blocks', async () => {
      const codeBlocks = [
        { lang: 'typescript', meta: null, value: 'const a = 1;' },
        { lang: 'typescript', meta: null, value: 'const b = 2;' },
      ]
      const testBlocks = [
        { lang: 'typescript', meta: 'test', value: 'test("example", () => { expect(1).toBe(1); });' },
      ]
      const fileName = 'example.mdx'

      const result = await createTempTestFile(codeBlocks, testBlocks, fileName)

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('.mdxe'), { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('example.test.ts'),
        expect.stringContaining('const a = 1;'),
        'utf-8'
      )
      expect(result).toContain('example.test.ts')
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
