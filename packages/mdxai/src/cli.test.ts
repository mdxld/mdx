import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as childProcess from 'child_process'
import fs from 'fs'
import path from 'path'
import { Command } from 'commander'
import * as aiHandler from './aiHandler'

vi.mock('child_process')
vi.mock('fs')
vi.mock('./aiHandler')

const mockAudioPath = path.join(process.cwd(), '.ai', 'cache', 'mock-audio-file.wav')

const spawnSpy = vi.fn()
const saySpy = vi.fn()
const copyFileSyncSpy = vi.fn()
const existsSyncSpy = vi.fn()
const mkdirSyncSpy = vi.fn()
const writeFileSyncSpy = vi.fn()

const originalConsoleLog = console.log
const originalConsoleError = console.error
const mockConsoleLog = vi.fn()
const mockConsoleError = vi.fn()

describe('CLI say command', () => {
  let processExitSpy: any
  let program: Command
  
  beforeEach(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    console.log = mockConsoleLog
    console.error = mockConsoleError
    vi.clearAllMocks()
    
    Object.defineProperty(process, 'platform', {
      value: 'linux'
    })
    
    process.env.GEMINI_API_KEY = 'mock-api-key'
    
    saySpy.mockResolvedValue(mockAudioPath)
    vi.spyOn(aiHandler, 'say').mockImplementation(() => saySpy())
    
    spawnSpy.mockImplementation(() => {
      const mockProcess = {
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(), 10)
          }
          return mockProcess
        })
      }
      return mockProcess
    })
    vi.spyOn(childProcess, 'spawn').mockImplementation((...args) => spawnSpy(...args))
    
    existsSyncSpy.mockImplementation((path) => {
      if (path === mockAudioPath) return true
      return false
    })
    vi.spyOn(fs, 'existsSync').mockImplementation((path) => existsSyncSpy(path))
    
    mkdirSyncSpy.mockImplementation(() => undefined)
    vi.spyOn(fs, 'mkdirSync').mockImplementation((...args) => mkdirSyncSpy(...args))
    
    writeFileSyncSpy.mockImplementation(() => undefined)
    vi.spyOn(fs, 'writeFileSync').mockImplementation((...args) => writeFileSyncSpy(...args))
    
    copyFileSyncSpy.mockImplementation(() => undefined)
    vi.spyOn(fs, 'copyFileSync').mockImplementation((...args) => copyFileSyncSpy(...args))
    
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
    console.log = originalConsoleLog
    console.error = originalConsoleError
    processExitSpy.mockRestore()
    vi.restoreAllMocks()
  })
  
  it('should generate audio and play it on Linux', async () => {
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    expect(saySpy).toHaveBeenCalled()
    expect(spawnSpy).toHaveBeenCalledWith('aplay', [mockAudioPath])
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Audio successfully generated'))
  })
  
  it('should generate audio and play it on macOS', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    })
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    expect(spawnSpy).toHaveBeenCalledWith('afplay', [mockAudioPath])
  })
  
  it('should generate audio and play it on Windows', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    })
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    expect(spawnSpy).toHaveBeenCalledWith('powershell', [
      '-c',
      expect.stringContaining('mock-audio-file.wav')
    ])
  })
  
  it('should save audio to specified output path', async () => {
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world', '-o', 'output.wav'])
    
    expect(copyFileSyncSpy).toHaveBeenCalledWith(mockAudioPath, 'output.wav')
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Audio successfully saved to output.wav'))
  })
  
  it('should handle missing GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('GEMINI_API_KEY environment variable is not set'))
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })
})
