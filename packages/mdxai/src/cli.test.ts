import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { Command } from 'commander'
import * as aiHandler from './aiHandler'

// Create test directory with unique ID to avoid conflicts
const testId = randomUUID()
const testDir = path.join(process.cwd(), '.ai', 'test', testId)
const testAudioPath = path.join(testDir, 'test-audio.wav')
const testOutputPath = path.join(testDir, 'output.wav')

// Store original console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error
const consoleOutput: string[] = []
const consoleErrorOutput: string[] = []

describe('CLI say command', () => {
  const originalProcessExit = process.exit
  let program: Command
  
  beforeEach(() => {
    // Create test directory and files
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    
    // Create a test audio file
    if (!fs.existsSync(testAudioPath)) {
      fs.writeFileSync(testAudioPath, Buffer.from('test audio data'))
    }
    
    // Capture console output
    console.log = (message: string) => {
      consoleOutput.push(message)
    }
    
    console.error = (message: string) => {
      consoleErrorOutput.push(message)
    }
    
    // Clear captured output
    consoleOutput.length = 0
    consoleErrorOutput.length = 0
    
    process.exit = ((code?: number) => {
      throw new Error(`Process exited with code ${code}`)
    }) as any
    
    // Create a real test audio file instead of mocking aiHandler.say
    if (!fs.existsSync(testAudioPath)) {
      fs.writeFileSync(testAudioPath, Buffer.from('test audio data'))
    }
    
    // Set up command
    program = new Command()
    program
      .command('say <text>')
      .option('-o, --output <filepath>', 'Specify output file path for the audio')
      .option('-v, --voice <voice>', 'Specify the voice to use', 'Kore')
      .option('-p, --play', 'Play the audio after generating it', true)
      .action(async (text: string, options: { output?: string; voice: string; play: boolean }) => {
        if (!process.env.GOOGLE_API_KEY) {
          console.error('GOOGLE_API_KEY environment variable is not set.')
          process.exit(1)
          return
        }
        
        const audioFilePath = await aiHandler.say`${text}`
        
        if (options.output) {
          fs.copyFileSync(audioFilePath, options.output)
          console.log(`Audio successfully saved to ${options.output}`)
        } else {
          console.log(`Audio successfully generated at ${audioFilePath}`)
        }
        
        if (options.play) {
          console.log(`Would play audio on ${process.platform} platform`)
        }
      })
  })
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog
    console.error = originalConsoleError
    
    // Restore process.exit
    process.exit = originalProcessExit
    
    // Clean up test files
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.error('Error cleaning up test directory:', error)
    }
  })
  
  it('should generate audio on Linux platform', async () => {
    process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY || 'test-api-key'
    
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'linux' })
    
    try {
      await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
      
      // Check console output
      expect(consoleOutput.length).toBeGreaterThan(0)
      expect(consoleOutput[0]).toContain('Audio successfully generated')
      expect(consoleOutput[1]).toContain('Would play audio on linux platform')
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    } finally {
      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform })
    }
  }, 60000) // Increase timeout for real API calls
  
  it('should generate audio on macOS platform', async () => {
    process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY || 'test-api-key'
    
    // Set platform to macOS
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    
    try {
      await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
      
      // Check console output
      expect(consoleOutput.length).toBeGreaterThan(0)
      expect(consoleOutput[0]).toContain('Audio successfully generated')
      expect(consoleOutput[1]).toContain('Would play audio on darwin platform')
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    } finally {
      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform })
    }
  }, 60000) // Increase timeout for real API calls
  
  it('should generate audio on Windows platform', async () => {
    process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY || 'test-api-key'
    
    // Set platform to Windows
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32' })
    
    try {
      await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
      
      // Check console output
      expect(consoleOutput.length).toBeGreaterThan(0)
      expect(consoleOutput[0]).toContain('Audio successfully generated')
      expect(consoleOutput[1]).toContain('Would play audio on win32 platform')
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    } finally {
      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform })
    }
  }, 60000) // Increase timeout for real API calls
  
  it('should save audio to specified output path', async () => {
    process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY || 'test-api-key'
    
    try {
      await program.parseAsync(['node', 'cli.js', 'say', 'Hello world', '-o', testOutputPath])
      
      // Check that the file was copied correctly
      expect(fs.existsSync(testOutputPath)).toBe(true)
      
      // Check console output
      expect(consoleOutput.length).toBeGreaterThan(0)
      expect(consoleOutput[0]).toContain(`Audio successfully saved to ${testOutputPath}`)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls
  
  it('should handle missing GOOGLE_API_KEY', async () => {
    // Ensure environment variable is not set
    const originalApiKey = process.env.GOOGLE_API_KEY
    delete process.env.GOOGLE_API_KEY
    
    try {
      await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
      
      expect(true).toBe(false) // Expected an error to be thrown when GOOGLE_API_KEY is missing
    } catch (error) {
      // Check console error output
      expect(consoleErrorOutput.length).toBeGreaterThan(0)
      expect(consoleErrorOutput[0]).toContain('GOOGLE_API_KEY environment variable is not set')
    } finally {
      // Restore API key
      if (originalApiKey) {
        process.env.GOOGLE_API_KEY = originalApiKey
      }
    }
  }, 60000) // Increase timeout for real API calls
})
