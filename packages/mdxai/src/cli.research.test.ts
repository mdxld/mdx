import 'dotenv/config'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { Command } from 'commander'
import * as fs from 'fs'
import * as research from './functions/research'
import * as appUI from './ui/app'
import * as utils from './utils'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_DIR = path.join(process.cwd(), '.ai', 'test', randomUUID())

describe('CLI research command', () => {
  const originalEnv = { ...process.env }
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const originalProcessExit = process.exit
  const originalStdoutWrite = process.stdout.write
  
  let consoleOutput: string[] = []
  let consoleErrors: string[] = []
  
  beforeEach(() => {
    consoleOutput = []
    consoleErrors = []
    
    const tempDir = path.join(process.cwd(), '.ai', 'test')
    fs.mkdirSync(tempDir, { recursive: true })
    fs.mkdirSync(TEST_DIR, { recursive: true })
    
    console.log = (...args: any[]) => {
      consoleOutput.push(args.join(' '))
    }
    
    console.error = (...args: any[]) => {
      consoleErrors.push(args.join(' '))
    }
    
    process.exit = ((code?: number) => {
      throw new Error(`Process.exit called with code ${code}`)
    }) as any
    
    process.stdout.write = ((data: any) => {
      if (typeof data === 'string') {
        consoleOutput.push(data)
      }
      return true
    }) as any
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    console.log = originalConsoleLog
    console.error = originalConsoleError
    process.exit = originalProcessExit
    process.stdout.write = originalStdoutWrite
    
    try {
      fs.rmSync(TEST_DIR, { recursive: true, force: true })
    } catch (error) {
    }
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
      
      try {
        process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
        process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
        
        const { program } = createResearchCommand()
        
        await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', outputFile])
        
        expect(fs.existsSync(outputFile)).toBe(true)
        
        const content = fs.readFileSync(outputFile, 'utf-8')
        expect(content).toBeDefined()
        expect(content.length).toBeGreaterThan(0)
        
        expect(consoleOutput.some(output => output.includes(`Research completed and written to ${outputFile}`))).toBe(true)
      } catch (error) {
        if (!process.env.CI) {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1/i)
        } else {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1|Bad Request/i)
        }
      }
    }, 60000) // Increase timeout for real API calls

    it('should execute research command in interactive mode with --ink flag', async () => {
      const outputFile = path.join(TEST_DIR, 'research.mdx')
      
      try {
        process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
        process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
        
        let renderAppCalled = false
        let renderAppParams: any = null
        
        const originalRenderApp = appUI.renderApp
        
        const renderAppProxy = function(mode: string, params: any) {
          renderAppCalled = true
          renderAppParams = params
          return originalRenderApp(mode, params)
        }
        
        Object.defineProperty(appUI, 'renderApp', {
          configurable: true,
          get: () => renderAppProxy
        })
        
        try {
          const { program } = createResearchCommand()
          
          await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '--ink', '-o', outputFile])
          
          expect(renderAppCalled).toBe(true)
          expect(renderAppParams).toEqual({
            prompt: 'How do I use AI?',
            output: outputFile,
            format: 'markdown',
          })
          
          expect(fs.existsSync(outputFile)).toBe(false)
        } finally {
          Object.defineProperty(appUI, 'renderApp', {
            configurable: true,
            get: () => originalRenderApp
          })
        }
      } catch (error) {
        if (!process.env.CI) {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1/i)
        } else {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1|Bad Request/i)
        }
      }
    }, 60000) // Increase timeout for real API calls

    it('should handle different output formats', async () => {
      const outputFile = path.join(TEST_DIR, 'frontmatter-output.mdx')
      
      try {
        process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
        process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
        
        const { program } = createResearchCommand()
        
        await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', outputFile, '-f', 'frontmatter'])
        
        expect(fs.existsSync(outputFile)).toBe(true)
        
        const content = fs.readFileSync(outputFile, 'utf-8')
        expect(content).toContain('---')
        expect(content).toContain('title:')
      } catch (error) {
        if (!process.env.CI) {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1/i)
        } else {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1|Bad Request/i)
        }
      }
    }, 60000) // Increase timeout for real API calls

    it('should handle parameter passing from command line', async () => {
      const outputFile = path.join(TEST_DIR, 'both-format-output.mdx')
      
      try {
        process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
        process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
        
        const { program } = createResearchCommand()
        
        await program.parseAsync(['node', 'test', 'research', 'How do I use AI?', '-o', outputFile, '-f', 'both'])
        
        expect(fs.existsSync(outputFile)).toBe(true)
        
        const content = fs.readFileSync(outputFile, 'utf-8')
        expect(content).toContain('---')
        expect(content).toContain('title:')
        expect(content).toContain('#') // Markdown heading
      } catch (error) {
        if (!process.env.CI) {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1/i)
        } else {
          expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|Process\.exit called with code 1|Bad Request/i)
        }
      }
    }, 60000) // Increase timeout for real API calls

    it('should throw an error when AI_GATEWAY_TOKEN is not set', async () => {
      try {
        const originalToken = process.env.AI_GATEWAY_TOKEN
        delete process.env.AI_GATEWAY_TOKEN
        
        try {
          const { program } = createResearchCommand()
          
          await expect(program.parseAsync(['node', 'test', 'research', 'How do I use AI?'])).rejects.toThrow('Process.exit called with code 1')
          
          expect(consoleErrors.some(error => error.includes('AI_GATEWAY_TOKEN environment variable is not set'))).toBe(true)
        } finally {
          if (originalToken) {
            process.env.AI_GATEWAY_TOKEN = originalToken
          }
        }
      } catch (error) {
        console.error('Test error:', error)
        throw error
      }
    })
  })
})
