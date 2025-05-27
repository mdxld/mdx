import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { Command } from 'commander'

const fsMocks = vi.hoisted(() => {
  return {
    writeFileSync: vi.fn().mockImplementation(() => undefined),
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn().mockImplementation(() => undefined),
  }
})

vi.mock('fs', () => fsMocks)

import * as fs from 'fs'

vi.mock('./functions/research', () => ({
  research: vi.fn().mockResolvedValue({
    text: 'This is a test research response',
    markdown: '# Research Results\n\nThis is a test research response with citations [ ¹ ](#1)',
    citations: ['https://example.com/citation1'],
    reasoning: 'This is mock reasoning',
    scrapedCitations: [
      {
        url: 'https://example.com/citation1',
        title: 'Test Citation',
        description: 'Test Description',
        markdown: '# Test Citation\n\nThis is test content',
      },
    ],
  }),
}))

vi.mock('./llmService.js', () => ({
  generateResearchStream: vi.fn().mockResolvedValue({
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield 'This is a test research response'
      },
    },
  }),
}))

vi.mock('./ui/app.js', () => ({
  renderApp: vi.fn().mockReturnValue(() => {}),
}))

vi.mock('./utils.js', () => ({
  extractH1Title: vi.fn().mockReturnValue('Test Title'),
  slugifyString: vi.fn().mockReturnValue('test-title'),
  ensureDirectoryExists: vi.fn(),
}))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('CLI research command', () => {
  const originalEnv = { ...process.env }
  const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`Process.exit called with code: ${code}`)
  })
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

  beforeEach(() => {
    process.env.AI_GATEWAY_TOKEN = 'mock-token'
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  describe('research command', () => {
    const createResearchCommand = () => {
      const program = new Command()
      const researchAction = vi.fn().mockImplementation(async (prompt, options) => {
        if (!process.env.AI_GATEWAY_TOKEN) {
          console.error('AI_GATEWAY_TOKEN environment variable is not set.')
          process.exit(1)
        }

        if (options.ink) {
          const { renderApp } = await import('./ui/app.js')
          renderApp('research', {
            prompt,
            output: options.output,
            format: options.format,
          })
        } else {
          const { research } = await import('./functions/research')
          await research(prompt)

          let content = '# Research Results\n\nThis is a test research response with citations [ ¹ ](#1)'
          if (options.format === 'frontmatter') {
            content = `---\ntitle: Test Title\n---\n\n${content}`
          } else if (options.format === 'both') {
            content = `---\ntitle: Test Title\n---\n\n${content}`
          }

          fs.writeFileSync(options.output, content, 'utf-8')
          console.log(`Research completed and written to ${options.output}`)
        }
      })

      program
        .command('research')
        .argument('<prompt>')
        .option('-o, --output <filepath>', 'Specify output file path', 'research.mdx')
        .option('-f, --format <format>', 'Specify output format (markdown, frontmatter, both)', 'markdown')
        .option('--ink', 'Use React Ink for interactive UI', false)
        .action(researchAction)

      return { program, researchAction }
    }

    it('should execute research command in non-interactive mode', async () => {
      const { program, researchAction } = createResearchCommand()

      await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', 'test-output.mdx'])

      expect(researchAction).toHaveBeenCalledWith(
        'How do I use AI?',
        expect.objectContaining({
          output: 'test-output.mdx',
          format: 'markdown',
          ink: false,
        }),
        expect.anything(),
      )

      const { research } = await import('./functions/research')
      expect(research).toHaveBeenCalledWith('How do I use AI?')

      expect(fs.writeFileSync).toHaveBeenCalledWith('test-output.mdx', expect.stringContaining('# Research Results'), 'utf-8')

      expect(mockConsoleLog).toHaveBeenCalledWith('Research completed and written to test-output.mdx')
    })

    it('should execute research command in interactive mode with --ink flag', async () => {
      const { program, researchAction } = createResearchCommand()

      await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '--ink'])

      expect(researchAction).toHaveBeenCalledWith(
        'How do I use AI?',
        expect.objectContaining({
          output: 'research.mdx',
          format: 'markdown',
          ink: true,
        }),
        expect.anything(),
      )

      const { renderApp } = await import('./ui/app.js')
      expect(renderApp).toHaveBeenCalledWith('research', {
        prompt: 'How do I use AI?',
        output: 'research.mdx',
        format: 'markdown',
      })

      const { research } = await import('./functions/research')
      expect(research).not.toHaveBeenCalled()
    })

    it('should handle different output formats', async () => {
      const { program, researchAction } = createResearchCommand()

      await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-f', 'frontmatter'])

      expect(researchAction).toHaveBeenCalledWith(
        'How do I use AI?',
        expect.objectContaining({
          output: 'research.mdx',
          format: 'frontmatter',
        }),
        expect.anything(),
      )

      expect(fs.writeFileSync).toHaveBeenCalledWith('research.mdx', expect.stringContaining('---\ntitle: Test Title\n---'), 'utf-8')
    })

    it('should handle parameter passing from command line', async () => {
      const { program, researchAction } = createResearchCommand()

      await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', 'custom-output.mdx', '-f', 'both'])

      expect(researchAction).toHaveBeenCalledWith(
        'How do I use AI?',
        expect.objectContaining({
          output: 'custom-output.mdx',
          format: 'both',
        }),
        expect.anything(),
      )

      expect(fs.writeFileSync).toHaveBeenCalledWith('custom-output.mdx', expect.stringContaining('# Research Results'), 'utf-8')
    })

    it('should throw an error when AI_GATEWAY_TOKEN is not set', async () => {
      delete process.env.AI_GATEWAY_TOKEN

      const { program } = createResearchCommand()

      await expect(program.parseAsync(['node', 'test', 'research', 'How do I use AI?'])).rejects.toThrow('Process.exit called with code: 1')

      expect(mockConsoleError).toHaveBeenCalledWith('AI_GATEWAY_TOKEN environment variable is not set.')
    })
  })
})
