import { beforeAll, describe, it, expect } from 'vitest'
import { $ } from 'zx'
import fs from 'node:fs'

beforeAll(() => {
  $`rm -rf .mdx`
})

describe('mdxld cli', () => {
  it('should parse all md/mdx files in a directory', async () => {
    const result = await $`pnpm mdxld build`

    // Check for generated files
    expect(fs.existsSync('./.mdx/index.d.ts')).toBe(true)
    expect(fs.existsSync('./.mdx/index.js')).toBe(true)
    expect(fs.existsSync('./.mdx/mdx.json')).toBe(true)
    
    // Use regex to match output without depending on absolute paths or timing
    expect(result.stdout).toMatch(/mdxld: Starting build process.../);
    expect(result.stdout).toMatch(/Source directory:/);
    expect(result.stdout).toMatch(/Output directory:/);
    expect(result.stdout).toMatch(/\[VELITE\] build finished in/);
    expect(result.stdout).toMatch(/mdxld: Build process complete/);
  })
})
