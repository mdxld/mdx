import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createCacheMiddleware } from './cacheMiddleware'

const CACHE_DIR = join(process.cwd(), '.ai/cache')

describe('Cache Middleware', () => {
  beforeEach(async () => {
    try {
      await fs.rm(CACHE_DIR, { recursive: true, force: true })
    } catch (error) {
    }
  })

  afterEach(async () => {
    try {
      await fs.rm(CACHE_DIR, { recursive: true, force: true })
    } catch (error) {
    }
  })

  it('should cache and retrieve generate results', async () => {
    const middleware = createCacheMiddleware()
    const mockParams = {
      temperature: 0.7,
      maxTokens: 100
    }
    
    const mockResult = { 
      text: 'cached response',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
    }

    const mockDoGenerate = vi.fn().mockResolvedValue(mockResult)

    const result1 = await middleware.wrapGenerate!({
      doGenerate: mockDoGenerate,
      params: mockParams 
    })
    expect(result1).toEqual(mockResult)
    expect(mockDoGenerate).toHaveBeenCalledTimes(1)

    const mockDoGenerate2 = vi.fn().mockImplementation(() => {
      throw new Error('Should not be called')
    })
    
    const result2 = await middleware.wrapGenerate!({
      doGenerate: mockDoGenerate2,
      params: mockParams 
    })
    expect(result2).toEqual(mockResult)
    expect(mockDoGenerate2).not.toHaveBeenCalled()
  })

  it('should create cache directory if it does not exist', async () => {
    const middleware = createCacheMiddleware()
    const mockParams = {
      temperature: 0.7,
      maxTokens: 100
    }
    
    const mockResult = { 
      text: 'test response',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
    }

    await middleware.wrapGenerate!({
      doGenerate: async () => mockResult,
      params: mockParams 
    })

    const dirExists = await fs.access(CACHE_DIR).then(() => true).catch(() => false)
    expect(dirExists).toBe(true)
  })

  it('should handle different cache keys for different parameters', async () => {
    const middleware = createCacheMiddleware()
    
    const mockParams1 = {
      temperature: 0.7,
      maxTokens: 100
    }
    
    const mockResult1 = { 
      text: 'response 1',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
    }
    
    const mockParams2 = {
      temperature: 0.5,
      maxTokens: 200
    }
    
    const mockResult2 = { 
      text: 'response 2',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
    }

    const mockDoGenerate1 = vi.fn().mockResolvedValue(mockResult1)
    const mockDoGenerate2 = vi.fn().mockResolvedValue(mockResult2)

    const result1 = await middleware.wrapGenerate!({
      doGenerate: mockDoGenerate1,
      params: mockParams1 
    })
    expect(result1).toEqual(mockResult1)
    expect(mockDoGenerate1).toHaveBeenCalledTimes(1)

    const result2 = await middleware.wrapGenerate!({
      doGenerate: mockDoGenerate2,
      params: mockParams2 
    })
    expect(result2).toEqual(mockResult2)
    expect(mockDoGenerate2).toHaveBeenCalledTimes(1)

    const result1Again = await middleware.wrapGenerate!({
      doGenerate: vi.fn().mockImplementation(() => {
        throw new Error('Should not be called')
      }),
      params: mockParams1 
    })
    expect(result1Again).toEqual(mockResult1)

    const result2Again = await middleware.wrapGenerate!({
      doGenerate: vi.fn().mockImplementation(() => {
        throw new Error('Should not be called')
      }),
      params: mockParams2 
    })
    expect(result2Again).toEqual(mockResult2)
  })

  it('should handle stream caching', async () => {
    const middleware = createCacheMiddleware()
    const mockParams = {
      temperature: 0.7,
      maxTokens: 100
    }
    
    const mockText = 'Hello'
    const mockStreamResult = {
      stream: new ReadableStream({
        start(controller) {
          for (const char of mockText) {
            controller.enqueue({ type: 'text-delta', textDelta: char })
          }
          controller.enqueue({ type: 'finish' })
          controller.close()
        }
      }),
      text: mockText, // Set the text property to the full text
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
    }

    const mockDoStream = vi.fn().mockResolvedValue(mockStreamResult)

    const result1 = await middleware.wrapStream!({
      doStream: mockDoStream,
      params: mockParams 
    })
    
    expect(mockDoStream).toHaveBeenCalledTimes(1)
    expect(result1.stream).toBeInstanceOf(ReadableStream)
    
    const readStream = async (stream) => {
      const reader = stream.getReader()
      let content = ''
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value && value.type === 'text-delta') {
            content += value.textDelta
          }
        }
      } catch (error) {
        console.error('Error reading stream:', error)
      } finally {
        reader.releaseLock()
      }
      
      return content
    }
    
    const streamContent = await readStream(result1.stream)
    expect(streamContent).toBe('Hello')

    await new Promise(resolve => setTimeout(resolve, 100))

    const mockDoStream2 = vi.fn().mockImplementation(() => {
      throw new Error('Should not be called')
    })
    
    const result2 = await middleware.wrapStream!({
      doStream: mockDoStream2,
      params: mockParams 
    })
    
    expect(mockDoStream2).not.toHaveBeenCalled()
    expect(result2.stream).toBeInstanceOf(ReadableStream)
    
    const cachedStreamContent = await readStream(result2.stream)
    expect(cachedStreamContent).toBe('Hello')
  }, 10000)
})
