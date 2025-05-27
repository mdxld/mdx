import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { say } from './aiHandler'
import fs from 'fs'
import path from 'path'

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return {
    ...actual,
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  }
})

vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    join: vi.fn().mockImplementation((...args) => args.join('/')),
  }
})

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: 'mock-audio-data',
                  },
                },
              ],
            },
          },
        ],
      }),
    },
  })),
}))

vi.mock('wav', () => ({
  FileWriter: vi.fn().mockImplementation(() => ({
    on: vi.fn().mockImplementation((event, callback) => {
      if (event === 'finish') {
        setTimeout(() => callback(), 10)
      }
      return this
    }),
    write: vi.fn(),
    end: vi.fn(),
  })),
}))

describe('say template function', () => {
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.GEMINI_API_KEY = 'mock-api-key'
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    process.env = { ...originalEnv }
  })
  
  it('should work as a template literal function', async () => {
    const result = await say`Hello world`
    
    expect(result).toBe('mock-audio-file.wav')
  })
  
  it('should handle variable interpolation', async () => {
    const text = 'Hello world'
    const result = await say`${text}`
    
    expect(result).toBe('mock-audio-file.wav')
  })
  
  it('should throw error when not used as template literal', () => {
    const incorrectUsage = new Function('say', 'return say("not a template literal")')
    
    expect(() => {
      incorrectUsage(say)
    }).toThrow('Say function must be called as a template literal')
  })
  
  it('should handle complex objects in template literals', async () => {
    const complexContext = {
      greeting: 'Hello',
      target: 'world',
    }
    
    const result = await say`Say ${complexContext}`
    
    expect(result).toBe('mock-audio-file.wav')
  })
})
