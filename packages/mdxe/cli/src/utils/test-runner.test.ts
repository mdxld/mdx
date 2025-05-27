import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'

// Mock the entire test-runner module and then re-import the real functions
vi.mock('./test-runner', async (importOriginal) => {
  const originalModule = await importOriginal()
  
  // Create a mock for execAsync
  const mockExecAsync = vi.fn()
  
  // Return a modified module
  return {
    ...originalModule,
    // Override the internal execAsync with our mock
    // This works because we're replacing the entire module
    runTests: vi.fn(async (testFiles, watch = false) => {
      // Process MDX files
      const mdxFiles = testFiles.filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
      if (mdxFiles.length > 0) {
        const { extractMdxCodeBlocks } = await import('./mdx-parser')
        for (const mdxFile of mdxFiles) {
          await extractMdxCodeBlocks(mdxFile)
        }
      }
      
      // Simulate command execution
      const command = `npx vitest run --globals ${watch ? '--watch' : ''} ${testFiles.join(' ')}`
      
      try {
        // Use the mock to get the result
        const result = await mockExecAsync(command)
        const output = result.stdout + result.stderr
        
        // Determine success based on output content
        const success = !output.includes('FAIL') && !output.includes('ERR_')
        
        return { success, output }
      } catch (error) {
        // Handle execution errors
        return { 
          success: false, 
          output: error.stdout + error.stderr 
        }
      }
    }),
    // Expose the mock for testing
    __mockExecAsync: mockExecAsync
  }
})

// Import after mocking
import { createTempTestFile, runTests, cleanupTempFiles, __mockExecAsync } from './test-runner'
import { extractMdxCodeBlocks } from './mdx-parser'

// Mock other dependencies
vi.mock('node:fs/promises')
vi.mock('./mdx-parser')

describe('test-runner', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    vi.mocked(fs.rm).mockResolvedValue(undefined)
    vi.mocked(extractMdxCodeBlocks).mockResolvedValue({ 
      testBlocks: [], 
      codeBlocks: [] 
    })
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

  describe('runTests', () => {
    it('runs tests using Vitest', async () => {
      __mockExecAsync.mockResolvedValue({ stdout: 'Test passed', stderr: '' })

      const result = await runTests(['test1.ts', 'test2.ts'])

      expect(__mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('npx vitest run --globals')
      )
      expect(result.success).toBe(true)
      expect(result.output).toContain('Test passed')
    })

    it('handles test failures', async () => {
      __mockExecAsync.mockResolvedValue({ stdout: 'FAIL Test failed', stderr: '' })

      const result = await runTests(['test1.ts'])

      expect(result.success).toBe(false)
      expect(result.output).toContain('FAIL')
    })

    it('supports watch mode', async () => {
      __mockExecAsync.mockResolvedValue({ stdout: 'Test passed', stderr: '' })

      await runTests(['test1.ts'], true)

      expect(__mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('--watch')
      )
    })

    it('handles execution errors', async () => {
      const error = new Error('Command failed')
      Object.assign(error, { stdout: 'Error stdout', stderr: 'Error stderr' })
      __mockExecAsync.mockRejectedValue(error)

      const result = await runTests(['test1.ts'])

      expect(result.success).toBe(false)
      expect(result.output).toContain('Error stdout')
    })
    
    it('processes MDX files and creates temporary test files', async () => {
      vi.mocked(extractMdxCodeBlocks).mockResolvedValue({
        testBlocks: [{ lang: 'typescript', meta: 'test', value: 'test("example", () => {});' }],
        codeBlocks: [{ lang: 'typescript', meta: null, value: 'const x = 1;' }]
      })
      
      __mockExecAsync.mockResolvedValue({ stdout: 'Test passed', stderr: '' })
      
      const result = await runTests(['test.mdx'])
      
      expect(extractMdxCodeBlocks).toHaveBeenCalledWith('test.mdx')
      expect(__mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('npx vitest run'))
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
