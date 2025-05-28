import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { Command } from 'commander'
import * as fs from 'fs'
import * as research from './functions/research'
import * as llmService from './llmService'
import * as appUI from './ui/app'
import * as utils from './utils'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_DIR = path.join(process.cwd(), '.ai', 'test', randomUUID())

describe('CLI research command', () => {
  const originalEnv = { ...process.env }
  const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`Process.exit called with code: ${code}`)
  })
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

  beforeEach(() => {
    vi.clearAllMocks()
    
    const tempDir = path.join(process.cwd(), '.ai', 'test')
    fs.mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })
  
  describe('research command', () => {
    const createResearchCommand = () => {
      const program = new Command()
      const researchAction = async (prompt: string, options: { ink?: boolean; output: string; format?: string }): Promise<void> => {
        if (!process.env.AI_GATEWAY_TOKEN) {
          console.error('AI_GATEWAY_TOKEN environment variable is not set.')
          process.exit(1)
        }

        if (options.ink) {
          appUI.renderApp('research', {
            prompt,
            output: options.output,
            format: options.format,
          })
        } else {
          const result = await research.research(prompt)

          let content = result.markdown
          if (options.format === 'frontmatter') {
            const title = utils.extractH1Title(content) || 'Research Results'
            content = `---\ntitle: ${title}\n---\n\n${content}`
          } else if (options.format === 'both') {
            const title = utils.extractH1Title(content) || 'Research Results'
            content = `---\ntitle: ${title}\n---\n\n${content}`
          }

          fs.writeFileSync(options.output, content, 'utf-8')
          console.log(`Research completed and written to ${options.output}`)
        }
      }

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
      const outputFile = path.join(TEST_DIR, 'test-output.mdx')
      
      const consoleLogSpy = vi.spyOn(console, 'log')
      
      try {
        const { program } = createResearchCommand()
        
        await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', outputFile])
        
        expect(fs.existsSync(outputFile)).toBe(true)
        
        const content = fs.readFileSync(outputFile, 'utf-8')
        expect(content).toBeDefined()
        expect(content.length).toBeGreaterThan(0)
        
        expect(consoleLogSpy).toHaveBeenCalledWith(`Research completed and written to ${outputFile}`)
      } finally {
        consoleLogSpy.mockRestore()
      }
    }, 60000) // Increase timeout for real API calls

    it('should execute research command in interactive mode with --ink flag', async () => {
      const outputFile = path.join(TEST_DIR, 'research.mdx')
      
      const renderAppSpy = vi.spyOn(appUI, 'renderApp')
      
      try {
        const { program } = createResearchCommand()
        
        await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '--ink', '-o', outputFile])
        
        expect(renderAppSpy).toHaveBeenCalledWith('research', {
          prompt: 'How do I use AI?',
          output: outputFile,
          format: 'markdown',
        })
        
        expect(fs.existsSync(outputFile)).toBe(false)
      } finally {
        renderAppSpy.mockRestore()
      }
    }, 60000) // Increase timeout for real API calls

    it('should handle different output formats', async () => {
      const outputFile = path.join(TEST_DIR, 'frontmatter-output.mdx')
      
      try {
        const { program } = createResearchCommand()
        
        await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', outputFile, '-f', 'frontmatter'])
        
        expect(fs.existsSync(outputFile)).toBe(true)
        
        const content = fs.readFileSync(outputFile, 'utf-8')
        expect(content).toContain('---')
        expect(content).toContain('title:')
      } catch (error) {
        console.error('Test error:', error)
        throw error
      }
    }, 60000) // Increase timeout for real API calls

    it('should handle parameter passing from command line', async () => {
      const outputFile = path.join(TEST_DIR, 'both-format-output.mdx')
      
      try {
        const { program } = createResearchCommand()
        
        await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', outputFile, '-f', 'both'])
        
        expect(fs.existsSync(outputFile)).toBe(true)
        
        const content = fs.readFileSync(outputFile, 'utf-8')
        expect(content).toContain('---')
        expect(content).toContain('title:')
        expect(content).toContain('#') // Markdown heading
      } catch (error) {
        console.error('Test error:', error)
        throw error
      }
    }, 60000) // Increase timeout for real API calls

    it('should throw an error when AI_GATEWAY_TOKEN is not set', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      
      try {
        delete process.env.AI_GATEWAY_TOKEN
        
        const { program } = createResearchCommand()
        
        await expect(program.parseAsync(['node', 'test', 'research', 'How do I use AI?'])).rejects.toThrow('Process.exit called with code: 1')
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('AI_GATEWAY_TOKEN environment variable is not set.')
      } finally {
        process.env.AI_GATEWAY_TOKEN = 'test-token'
        consoleErrorSpy.mockRestore()
      }
    })
  })
})
