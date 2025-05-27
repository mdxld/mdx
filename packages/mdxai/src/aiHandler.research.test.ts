import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './aiHandler.research'
import fs from 'fs'
import matter from 'gray-matter'
import yaml from 'yaml'
import * as aiModule from 'ai'

// Mock modules at the top level
vi.mock('gray-matter')
vi.mock('yaml', () => ({
  stringify: vi.fn().mockImplementation((obj) => JSON.stringify(obj, null, 2)),
  parse: vi.fn().mockImplementation((str) => JSON.parse(str)),
}))

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'mock string response',
    response: {
      body: {
        choices: [
          {
            message: {
              content: 'mock string response',
            },
          },
        ],
      },
    },
  }),
  streamText: vi.fn().mockResolvedValue({
    text: 'mock string response',
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield 'mock string response'
      },
    },
  }),
  model: vi.fn().mockReturnValue('mock-model'),
}))

// Mock gray-matter file
function createMockGrayMatterFile(data: Record<string, any>, content: string) {
  return {
    data,
    content,
    orig: content,
    language: 'md',
    matter: '',
    stringify: () => content,
    isEmpty: false,
  }
}

describe('research template literal', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
    
    vi.spyOn(fs, 'readFileSync').mockReturnValue('mock file content')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    
    vi.mocked(matter).mockImplementation(() => 
      createMockGrayMatterFile({ output: 'string' }, 'You are a research assistant. ${prompt}')
    )
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should handle template literals with variable interpolation', async () => {
    const topic = 'TypeScript'
    const result = await research`Research about ${topic}`

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('mock string response')
  })

  it('should throw an error when not called as a template literal', () => {
    // @ts-ignore - Testing incorrect usage
    expect(() => research('not a template literal')).toThrow('research function must be used as a template literal tag')
  })

  it('should stringify arrays to YAML format', async () => {
    const items = ['TypeScript', 'JavaScript', 'React']
    const result = await research`Research these technologies: ${items}`

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('mock string response')
    expect(yaml.stringify).toHaveBeenCalledWith(items)
  })

  it('should stringify objects to YAML format', async () => {
    const project = {
      name: 'MDX AI',
      technologies: ['TypeScript', 'React'],
    }
    const result = await research`Research this project: ${project}`

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('mock string response')
    expect(yaml.stringify).toHaveBeenCalledWith(project)
  })
})
