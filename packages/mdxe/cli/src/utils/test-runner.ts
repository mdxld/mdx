import fs from 'node:fs/promises'
import path from 'node:path'
import * as esbuild from 'esbuild'
import { startVitest } from 'vitest/node'
import type { VitestRunMode, UserWorkspaceConfig } from 'vitest'
import type { CodeBlock } from './mdx-parser'

/**
 * Bundle code blocks and test blocks for testing
 */
export async function bundleCodeForTesting(codeBlocks: CodeBlock[], testBlocks: CodeBlock[]): Promise<string> {
  const combinedSource = [
    ...codeBlocks.map(block => block.value),
    ...testBlocks.map(block => block.value)
  ].join('\n\n')
  
  const result = await esbuild.transform(combinedSource, {
    loader: 'ts',
    target: 'es2020',
    format: 'esm',
  })
  
  return result.code
}

/**
 * Run tests using Vitest programmatic API
 */
export async function runTestsWithVitest(
  bundledCode: string,
  filePath: string,
  watch = false,
): Promise<{
  success: boolean
  output: string
}> {
  try {
    const virtualFilePath = `/virtual/${path.basename(filePath)}.test.js`
    
    const fileSystem = {
      [virtualFilePath]: bundledCode
    }
    
    let testOutput = ''
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    
    console.log = (...args) => {
      testOutput += args.join(' ') + '\n'
      originalConsoleLog(...args)
    }
    
    console.error = (...args) => {
      testOutput += args.join(' ') + '\n'
      originalConsoleError(...args)
    }
    
    const customFs = {
      readFile: async (path: string) => {
        if (fileSystem[path]) {
          return fileSystem[path]
        }
        throw new Error(`File not found: ${path}`)
      },
      existsSync: (path: string) => {
        return !!fileSystem[path]
      },
      statSync: (path: string) => {
        if (fileSystem[path]) {
          return {
            isFile: () => true,
            isDirectory: () => false,
          }
        }
        throw new Error(`File not found: ${path}`)
      }
    }

    const config: UserWorkspaceConfig = {
      test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.{js,ts}'],
      }
    }

    const vitest = await startVitest(
      watch ? 'watch' as VitestRunMode : 'run' as VitestRunMode,
      [virtualFilePath],
      config
    )
    
    vitest.ctx.vitenode.fs = {
      ...vitest.ctx.vitenode.fs,
      ...customFs
    }
    
    const testResults = await vitest.run()
    
    const testState = vitest.getState()
    
    console.log = originalConsoleLog
    console.error = originalConsoleError
    
    if (!watch) {
      await vitest.close()
    }
    
    const success = testState.getCountOfFailedTests() === 0
    
    return { 
      success, 
      output: testOutput 
    }
  } catch (error: any) {
    return {
      success: false,
      output: error.message || String(error),
    }
  }
}

/**
 * Clean up temporary test files (legacy function kept for compatibility)
 */
export async function cleanupTempFiles(): Promise<void> {
  return Promise.resolve()
}
