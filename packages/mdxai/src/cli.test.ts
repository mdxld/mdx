import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as childProcess from 'child_process'
import fs from 'fs'
import path from 'path'
import { Command } from 'commander'
import * as aiHandler from './aiHandler'
import { randomUUID } from 'crypto'

// Use real implementations with temporary test files
const testId = randomUUID()
const testDir = path.join(process.cwd(), '.ai', 'test', testId)
const testAudioPath = path.join(testDir, 'test-audio.wav')
const testOutputPath = path.join(testDir, 'output.wav')

// Store original console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error
const consoleLogOutput: string[] = []
const consoleErrorOutput: string[] = []

describe('CLI say command', () => {
  let processExitSpy: any
  let program: Command
  let spawnCalls: any[] = []
  
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    
    // Create a test audio file
    if (!fs.existsSync(testAudioPath)) {
      fs.writeFileSync(testAudioPath, Buffer.from('test audio data'))
    }
    
    // Mock console methods to capture output
    console.log = (message: string) => {
      consoleLogOutput.push(message)
    }
    console.error = (message: string) => {
      consoleErrorOutput.push(message)
    }
    
    // Clear captured output
    consoleLogOutput.length = 0
    consoleErrorOutput.length = 0
    
    // Mock process.exit to prevent tests from terminating
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    
    // Mock platform for testing
    Object.defineProperty(process, 'platform', {
      value: 'linux'
    })
    
    // Create a wrapper for spawn to track calls without mocking
    const originalSpawn = childProcess.spawn
    childProcess.spawn = function trackingSpawn(command: string, args: any[]) {
      spawnCalls.push({ command, args })
      return {
        on: (event: string, callback: Function) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10)
          }
          return this
        }
      } as any
    }
    
    // Mock aiHandler.say to return test audio path
    vi.spyOn(aiHandler, 'say').mockImplementation(() => {
      return Promise.resolve(testAudioPath)
    })
    
    // Set up command
    program = new Command()
    program
      .command('say <text>')
      .option('-o, --output <filepath>', 'Specify output file path for the audio')
      .option('-v, --voice <voice>', 'Specify the voice to use', 'Kore')
      .option('-p, --play', 'Play the audio after generating it', true)
      .action(async (text: string, options: { output?: string; voice: string; play: boolean }) => {
        if (!process.env.GEMINI_API_KEY) {
          console.error('GEMINI_API_KEY environment variable is not set.')
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
          if (process.platform === 'linux') {
            childProcess.spawn('aplay', [audioFilePath])
          } else if (process.platform === 'darwin') {
            childProcess.spawn('afplay', [audioFilePath])
          } else if (process.platform === 'win32') {
            childProcess.spawn('powershell', ['-c', `(New-Object System.Media.SoundPlayer "${audioFilePath}").PlaySync()`])
          }
        }
      })
  })
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog
    console.error = originalConsoleError
    
    // Restore original spawn function
    childProcess.spawn = originalSpawn
    
    // Reset spawn calls
    spawnCalls = []
    
    // Restore all mocks
    vi.restoreAllMocks()
    
    // Clean up test files
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.error('Error cleaning up test directory:', error)
    }
  })
  
  it('should generate audio and play it on Linux', async () => {
    // Set environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    // Check that spawn was called with correct arguments
    expect(spawnCalls.length).toBeGreaterThan(0)
    expect(spawnCalls[0].command).toBe('aplay')
    expect(spawnCalls[0].args[0]).toBe(testAudioPath)
    
    // Check console output
    expect(consoleLogOutput.length).toBeGreaterThan(0)
    expect(consoleLogOutput[0]).toContain('Audio successfully generated')
  }, 60000) // Increase timeout for real API calls
  
  it('should generate audio and play it on macOS', async () => {
    // Set environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
    
    // Change platform to macOS
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    })
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    // Check that spawn was called with correct arguments
    expect(spawnCalls.length).toBeGreaterThan(0)
    expect(spawnCalls[0].command).toBe('afplay')
    expect(spawnCalls[0].args[0]).toBe(testAudioPath)
  }, 60000) // Increase timeout for real API calls
  
  it('should generate audio and play it on Windows', async () => {
    // Set environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
    
    // Change platform to Windows
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    })
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    // Check that spawn was called with correct arguments
    expect(spawnCalls.length).toBeGreaterThan(0)
    expect(spawnCalls[0].command).toBe('powershell')
    expect(spawnCalls[0].args[0]).toBe('-c')
    expect(spawnCalls[0].args[1]).toContain(testAudioPath)
  }, 60000) // Increase timeout for real API calls
  
  it('should save audio to specified output path', async () => {
    // Set environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
    
    // Create spy for copyFileSync
    const copyFileSpy = vi.spyOn(fs, 'copyFileSync')
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world', '-o', testOutputPath])
    
    // Check that copyFileSync was called with correct arguments
    expect(copyFileSpy).toHaveBeenCalledWith(testAudioPath, testOutputPath)
    
    // Check console output
    expect(consoleLogOutput.length).toBeGreaterThan(0)
    expect(consoleLogOutput[0]).toContain(`Audio successfully saved to ${testOutputPath}`)
  }, 60000) // Increase timeout for real API calls
  
  it('should handle missing GEMINI_API_KEY', async () => {
    // Ensure environment variable is not set
    delete process.env.GEMINI_API_KEY
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    // Check console error output
    expect(consoleErrorOutput.length).toBeGreaterThan(0)
    expect(consoleErrorOutput[0]).toContain('GEMINI_API_KEY environment variable is not set')
    
    // Check that process.exit was called with correct code
    expect(processExitSpy).toHaveBeenCalledWith(1)
  }, 60000) // Increase timeout for real API calls
})
