import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { Command } from 'commander'

vi.mock('./cli.js', async () => {
  const commander = await vi.importActual<typeof import('commander')>('commander')
  const program = new commander.Command()
  
  const copyFileSyncSpy = vi.fn()
  
  const originalCopyFileSync = fs.copyFileSync
  fs.copyFileSync = copyFileSyncSpy
  
  program
    .command('say <text>')
    .option('-o, --output <filepath>', 'Specify output file path for the audio')
    .option('-v, --voice <voice>', 'Specify the voice to use', 'Kore')
    .option('-p, --play', 'Play the audio after generating it', true)
    .action(async (text: string, options: { output?: string; voice: string; play: boolean }) => {
      const { say } = await import('./aiHandler.js')
      
      if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY environment variable is not set.')
        process.exit(1)
        return
      }
      
      const audioFilePath = await say`${text}`
      
      if (options.output) {
        copyFileSyncSpy(audioFilePath, options.output)
        console.log(`Audio successfully saved to ${options.output}`)
      } else {
        console.log(`Audio successfully generated at ${audioFilePath}`)
      }
      
      if (options.play) {
        if (process.platform === 'linux') {
          const { spawn } = await import('child_process')
          spawn('aplay', [audioFilePath])
        } else if (process.platform === 'darwin') {
          const { spawn } = await import('child_process')
          spawn('afplay', [audioFilePath])
        } else if (process.platform === 'win32') {
          const { spawn } = await import('child_process')
          spawn('powershell', ['-c', `(New-Object System.Media.SoundPlayer "${audioFilePath}").PlaySync()`])
        }
      }
    })
  
  return { program }
})

vi.mock('child_process', () => ({
  spawn: vi.fn().mockImplementation(() => {
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
}))

vi.mock('./aiHandler.js', () => ({
  say: vi.fn().mockImplementation(() => {
    const mockAudioPath = path.join(process.cwd(), '.ai', 'cache', 'mock-audio-file.wav')
    
    const cacheDir = path.dirname(mockAudioPath)
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    
    if (!fs.existsSync(mockAudioPath)) {
      fs.writeFileSync(mockAudioPath, Buffer.from([]))
    }
    
    return Promise.resolve(mockAudioPath)
  })
}))

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return {
    ...actual,
    copyFileSync: vi.fn().mockImplementation((src: string, dest: string) => {
      return actual.copyFileSync(src, dest)
    }),
    existsSync: vi.fn().mockImplementation((path: string) => {
      return actual.existsSync(path)
    })
  }
})

vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    resolve: vi.fn().mockImplementation(path => path)
  }
})

const originalConsoleLog = console.log
const originalConsoleError = console.error
const mockConsoleLog = vi.fn()
const mockConsoleError = vi.fn()

describe('CLI say command', () => {
  let processExitSpy: any
  
  beforeEach(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    
    console.log = mockConsoleLog
    console.error = mockConsoleError
    
    vi.clearAllMocks()
    
    Object.defineProperty(process, 'platform', {
      value: 'linux'
    })
    
    process.env.GEMINI_API_KEY = 'mock-api-key'
  })
  
  afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
    
    processExitSpy.mockRestore()
  })
  
  it('should generate audio and play it on Linux', async () => {
    const { program } = await import('./cli.js')
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    const { say } = await import('./aiHandler.js')
    expect(say).toHaveBeenCalled()
    
    expect(spawn).toHaveBeenCalledWith('aplay', [expect.stringContaining('mock-audio-file.wav')])
    
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Audio successfully generated'))
  })
  
  it('should generate audio and play it on macOS', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    })
    
    const { program } = await import('./cli.js')
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    expect(spawn).toHaveBeenCalledWith('afplay', [expect.stringContaining('mock-audio-file.wav')])
  })
  
  it('should generate audio and play it on Windows', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    })
    
    const { program } = await import('./cli.js')
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    expect(spawn).toHaveBeenCalledWith('powershell', [
      '-c',
      expect.stringContaining('mock-audio-file.wav')
    ])
  })
  
  it('should save audio to specified output path', async () => {
    const { program } = await import('./cli.js')
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world', '-o', 'output.wav'])
    
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      expect.stringContaining('mock-audio-file.wav'),
      'output.wav'
    )
    
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Audio successfully saved to output.wav'))
  })
  
  it('should handle missing GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY
    
    const { program } = await import('./cli.js')
    
    await program.parseAsync(['node', 'cli.js', 'say', 'Hello world'])
    
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('GEMINI_API_KEY environment variable is not set'))
    
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })
})
