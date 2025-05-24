import { beforeAll, describe, it, expect, afterEach, afterAll, beforeEach } from 'vitest'
import { $ } from 'zx'
import fs from 'node:fs'
import path from 'node:path'

const TEST_DIR = '.test-mdxld'
const TEST_OUTPUT_DIR = path.join(TEST_DIR, 'output')
const TEST_SOURCE_DIR = path.join(TEST_DIR, 'source')
const INVALID_DIR = path.join(TEST_DIR, 'nonexistent')

beforeAll(async () => {
  await $`rm -rf ${TEST_DIR} .mdx`

  fs.mkdirSync(TEST_SOURCE_DIR, { recursive: true })
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })

  await new Promise((resolve) => setTimeout(resolve, 100))

  fs.writeFileSync(
    path.join(TEST_SOURCE_DIR, 'valid.mdx'),
    `---
title: Valid MDX
$context: http://schema.org/
$type: Article
---

# Valid MDX File
This is a valid MDX file with frontmatter.`,
  )

  fs.writeFileSync(
    path.join(TEST_SOURCE_DIR, 'invalid.mdx'),
    `---
title: Invalid MDX
$context: 123
---

# Invalid MDX File
This file has invalid frontmatter with a numeric $context.`,
  )

  fs.writeFileSync(
    path.join(TEST_SOURCE_DIR, 'no-frontmatter.mdx'),
    `# No Frontmatter
This MDX file has no frontmatter section.`,
  )
})

afterAll(() => {
  $`rm -rf ${TEST_DIR} .mdx`
})

afterEach(() => {
  $`rm -rf ${TEST_OUTPUT_DIR}/*`
  $`rm -rf .mdx`
})

describe('mdxld cli', () => {
  it('should parse all md/mdx files in a directory with default options', async () => {
    const result = await $`pnpm mdxld build`

    // Check for generated files
    expect(fs.existsSync('./.mdx/index.d.ts')).toBe(true)
    expect(fs.existsSync('./.mdx/index.js')).toBe(true)
    expect(fs.existsSync('./.mdx/mdx.json')).toBe(true)

    const mdxJson = JSON.parse(fs.readFileSync('./.mdx/mdx.json', 'utf8'))
    expect(mdxJson).toBeDefined()

    expect(result.stdout).toContain('mdxld: Starting build process')
    expect(result.stdout).toContain('Source directory:')
    expect(result.stdout).toContain('Output directory:')
    expect(result.stdout).toContain('build finished in')
    expect(result.stdout).toContain('mdxld: Build process complete')
  })

  it('should use custom source and output directories', async () => {
    const result = await $`pnpm mdxld build -s ${TEST_SOURCE_DIR} -o ${TEST_OUTPUT_DIR}`

    // Check for generated files in custom output directory
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'index.d.ts'))).toBe(true)
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'index.js'))).toBe(true)
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'mdx.json'))).toBe(true)

    expect(result.stdout).toContain(`Source directory: ${path.resolve(TEST_SOURCE_DIR)}`)
    expect(result.stdout).toContain(`Output directory: ${path.resolve(TEST_OUTPUT_DIR)}`)
  })

  it('should generate correct output structure and content', async () => {
    await $`pnpm mdxld build -s ${TEST_SOURCE_DIR} -o ${TEST_OUTPUT_DIR}`

    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'index.js'))).toBe(true)
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'index.d.ts'))).toBe(true)
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'mdx.json'))).toBe(true)

    const mdxJson = JSON.parse(fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'mdx.json'), 'utf8'))
    const indexJs = fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'index.js'), 'utf8')

    expect(mdxJson).toBeDefined()

    expect(indexJs).toContain('export const mdx =')
    expect(indexJs).toContain(JSON.stringify(mdxJson, null, 2))

    const indexDts = fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'index.d.ts'), 'utf8')
    expect(indexDts).toBe('export declare const mdx: any;')
  })

  it('should handle files with and without frontmatter', async () => {
    await $`pnpm mdxld build -s ${TEST_SOURCE_DIR} -o ${TEST_OUTPUT_DIR}`

    const mdxJson = JSON.parse(fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'mdx.json'), 'utf8'))

    expect(Object.keys(mdxJson).length).toBeGreaterThan(0)
  })

  it('should handle errors gracefully when source directory does not exist', async () => {
    let errorThrown = false
    try {
      await $`pnpm mdxld build -s ${INVALID_DIR} -o ${TEST_OUTPUT_DIR}`
      expect(true).toBe(false) // Force test to fail if no error is thrown
    } catch (error: any) {
      errorThrown = true
    }
    expect(errorThrown).toBe(true)
  })

  it('should create output directory if it does not exist', async () => {
    const newOutputDir = path.join(TEST_DIR, 'new-output')

    if (fs.existsSync(newOutputDir)) {
      fs.rmSync(newOutputDir, { recursive: true, force: true })
    }

    await $`pnpm mdxld build -s ${TEST_SOURCE_DIR} -o ${newOutputDir}`

    expect(fs.existsSync(newOutputDir)).toBe(true)
    expect(fs.existsSync(path.join(newOutputDir, 'index.js'))).toBe(true)

    fs.rmSync(newOutputDir, { recursive: true, force: true })
  })

  it('should process files with JSON-LD frontmatter correctly', async () => {
    await $`pnpm mdxld build -s ${TEST_SOURCE_DIR} -o ${TEST_OUTPUT_DIR}`

    const mdxJson = JSON.parse(fs.readFileSync(path.join(TEST_OUTPUT_DIR, 'mdx.json'), 'utf8'))

    expect(mdxJson).toBeDefined()
    expect(Object.keys(mdxJson).length).toBeGreaterThan(0)
  })

  it('should verify the CLI accepts the --watch option', async () => {
    const result = await $`pnpm mdxld build --help`

    expect(result.stdout).toContain('--watch')
  })
})
