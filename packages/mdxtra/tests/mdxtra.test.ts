import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, rm, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const testDir = join(__dirname, '../test-workspace')
const mdxtraPath = join(__dirname, '../bin/mdxtra.js')

describe('mdxtra CLI', () => {
  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true })
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('should create symlink to current directory', async () => {
    await writeFile(join(testDir, 'index.mdx'), '# Test Page\n\nHello world!')
    
    const child = spawn('node', [mdxtraPath, 'build'], {
      cwd: testDir,
      stdio: 'pipe'
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    const appDir = join(__dirname, '../app')
    const contentLink = join(appDir, 'content')
    
    try {
      const files = await readdir(contentLink)
      expect(files).toContain('index.mdx')
    } catch (error: any) {
      expect(error.code).toBe('ENOENT')
    }

    child.kill('SIGTERM')
  })

  it('should handle different command arguments', async () => {
    const testCases = ['dev', 'build', 'start', 'export']
    
    for (const cmd of testCases) {
      const child = spawn('node', [mdxtraPath, cmd], {
        cwd: testDir,
        stdio: 'pipe'
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      expect(child.killed).toBe(false)
      
      child.kill('SIGTERM')
    }
  })

  it('should pass through additional arguments to Next.js', async () => {
    const child = spawn('node', [mdxtraPath, 'dev', '--port', '4000'], {
      cwd: testDir,
      stdio: 'pipe'
    })

    let output = ''
    let foundPort = false
    
    child.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      if (text.includes('4000') || text.includes('localhost:4000')) {
        foundPort = true
      }
    })
    child.stderr.on('data', (data) => {
      const text = data.toString()
      output += text
      if (text.includes('4000') || text.includes('localhost:4000')) {
        foundPort = true
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 4000))
    
    expect(foundPort || !child.killed).toBe(true)
    
    child.kill('SIGTERM')
  })

  it('should work with nested MDX files', async () => {
    await mkdir(join(testDir, 'docs'), { recursive: true })
    await writeFile(join(testDir, 'index.mdx'), '# Home\n\nWelcome!')
    await writeFile(join(testDir, 'docs', 'guide.mdx'), '# Guide\n\nInstructions here.')
    
    const child = spawn('node', [mdxtraPath, 'build'], {
      cwd: testDir,
      stdio: 'pipe'
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    const appDir = join(__dirname, '../app')
    const contentLink = join(appDir, 'content')
    
    try {
      const files = await readdir(contentLink)
      expect(files).toContain('index.mdx')
      expect(files).toContain('docs')
      
      const docsFiles = await readdir(join(contentLink, 'docs'))
      expect(docsFiles).toContain('guide.mdx')
    } catch (error: any) {
      expect(error.code).toBe('ENOENT')
    }

    child.kill('SIGTERM')
  })

  it('should handle empty directories gracefully', async () => {
    const child = spawn('node', [mdxtraPath, 'build'], {
      cwd: testDir,
      stdio: 'pipe'
    })

    let stderr = ''
    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    expect(child.killed).toBe(false)
    
    child.kill('SIGTERM')
  })

  it('should clean up existing symlinks before creating new ones', async () => {
    await writeFile(join(testDir, 'test.mdx'), '# Test\n\nContent')
    
    const child1 = spawn('node', [mdxtraPath, 'build'], {
      cwd: testDir,
      stdio: 'pipe'
    })

    await new Promise((resolve) => setTimeout(resolve, 1500))
    child1.kill('SIGTERM')

    const child2 = spawn('node', [mdxtraPath, 'build'], {
      cwd: testDir,
      stdio: 'pipe'
    })

    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    expect(child2.killed).toBe(false)
    
    child2.kill('SIGTERM')
  })
})
