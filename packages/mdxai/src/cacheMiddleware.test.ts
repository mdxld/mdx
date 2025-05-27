import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createCacheMiddleware, CacheConfig } from './cacheMiddleware'
import { LanguageModelV1StreamPart } from 'ai'
import { LRUCache } from 'lru-cache'

vi.mock('lru-cache', () => {
  return {
    LRUCache: vi.fn().mockImplementation(() => {
      const cache = new Map()
      return {
        get: vi.fn((key) => cache.get(key)),
        set: vi.fn((key, value) => cache.set(key, value)),
        has: vi.fn((key) => cache.has(key)),
        delete: vi.fn((key) => cache.delete(key)),
        clear: vi.fn(() => cache.clear()),
      }
    }),
  }
})

const CACHE_DIR = join(process.cwd(), '.ai/cache')

const createMockParams = (overrides = {}) => {
  return {
    inputFormat: 'messages',
    mode: { type: 'regular' },
    prompt: { messages: [] },
    ...overrides,
  }
}

describe('Cache Middleware', () => {
  beforeEach(async () => {
    try {
      await fs.rm(CACHE_DIR, { recursive: true, force: true })
    } catch (error) {}

    vi.clearAllMocks()
  })

  afterEach(async () => {
    try {
      await fs.rm(CACHE_DIR, { recursive: true, force: true })
    } catch (error) {}
  })

  it('should cache and retrieve generate results', async () => {
    const middleware = createCacheMiddleware()
    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult = {
      text: 'cached response',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    const mockDoGenerate = vi.fn().mockResolvedValue(mockResult)

    const result1 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate,
      params: mockParams,
    })
    expect(result1).toEqual(mockResult)
    expect(mockDoGenerate).toHaveBeenCalledTimes(1)

    const mockDoGenerate2 = vi.fn().mockImplementation(() => {
      throw new Error('Should not be called')
    })

    const result2 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate2,
      params: mockParams,
    })
    expect(result2).toEqual(mockResult)
    expect(mockDoGenerate2).not.toHaveBeenCalled()
  })

  it('should create cache directory if it does not exist', async () => {
    const middleware = createCacheMiddleware()
    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult = {
      text: 'test response',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    await (middleware.wrapGenerate as any)({
      doGenerate: async () => mockResult,
      params: mockParams,
    })

    const dirExists = await fs
      .access(CACHE_DIR)
      .then(() => true)
      .catch(() => false)
    expect(dirExists).toBe(true)
  })

  it('should handle different cache keys for different parameters', async () => {
    const middleware = createCacheMiddleware()

    const mockParams1 = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult1 = {
      text: 'response 1',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    const mockParams2 = createMockParams({
      temperature: 0.5,
      maxTokens: 200,
    })

    const mockResult2 = {
      text: 'response 2',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    const mockDoGenerate1 = vi.fn().mockResolvedValue(mockResult1)
    const mockDoGenerate2 = vi.fn().mockResolvedValue(mockResult2)

    const result1 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate1,
      params: mockParams1,
    })
    expect(result1).toEqual(mockResult1)
    expect(mockDoGenerate1).toHaveBeenCalledTimes(1)

    const result2 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate2,
      params: mockParams2,
    })
    expect(result2).toEqual(mockResult2)
    expect(mockDoGenerate2).toHaveBeenCalledTimes(1)

    const result1Again = await (middleware.wrapGenerate as any)({
      doGenerate: vi.fn().mockImplementation(() => {
        throw new Error('Should not be called')
      }),
      params: mockParams1,
    })
    expect(result1Again).toEqual(mockResult1)

    const result2Again = await (middleware.wrapGenerate as any)({
      doGenerate: vi.fn().mockImplementation(() => {
        throw new Error('Should not be called')
      }),
      params: mockParams2,
    })
    expect(result2Again).toEqual(mockResult2)
  })

  it('should handle stream caching', async () => {
    const middleware = createCacheMiddleware()
    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockText = 'Hello'
    const mockStreamResult = {
      stream: new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          for (const char of mockText) {
            controller.enqueue({ type: 'text-delta', textDelta: char })
          }
          controller.enqueue({
            type: 'finish',
            finishReason: 'stop' as const,
            usage: {
              promptTokens: 10,
              completionTokens: 5,
            },
          })
          controller.close()
        },
      }),
      rawCall: { rawPrompt: {}, rawSettings: {} },
    }

    const mockDoStream = vi.fn().mockResolvedValue(mockStreamResult)

    const result1 = await (middleware.wrapStream as any)({
      doStream: mockDoStream,
      params: mockParams,
    })

    expect(mockDoStream).toHaveBeenCalledTimes(1)
    expect(result1.stream).toBeInstanceOf(ReadableStream)

    const readStream = async (stream: ReadableStream<LanguageModelV1StreamPart>) => {
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

    await new Promise((resolve) => setTimeout(resolve, 100))

    const mockDoStream2 = vi.fn().mockImplementation(() => {
      throw new Error('Should not be called')
    })

    const result2 = await (middleware.wrapStream as any)({
      doStream: mockDoStream2,
      params: mockParams,
    })

    expect(mockDoStream2).not.toHaveBeenCalled()
    expect(result2.stream).toBeInstanceOf(ReadableStream)

    const cachedStreamContent = await readStream(result2.stream)
    expect(cachedStreamContent).toBe('Hello')
  }, 10000)

  it('should respect the enabled configuration option', async () => {
    const middleware = createCacheMiddleware({ enabled: false })
    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult = {
      text: 'test response',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    const mockDoGenerate = vi.fn().mockResolvedValue(mockResult)

    const result1 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate,
      params: mockParams,
    })
    expect(result1).toEqual(mockResult)
    expect(mockDoGenerate).toHaveBeenCalledTimes(1)

    const mockDoGenerate2 = vi.fn().mockResolvedValue(mockResult)
    const result2 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate2,
      params: mockParams,
    })
    expect(result2).toEqual(mockResult)
    expect(mockDoGenerate2).toHaveBeenCalledTimes(1)
  })

  it('should respect TTL configuration and expire cache entries', async () => {
    const realDateNow = Date.now
    const mockTime = 1000000
    Date.now = vi.fn().mockReturnValue(mockTime)

    // Create middleware with short TTL
    const middleware = createCacheMiddleware({
      ttl: 1000, // 1 second TTL
      memoryCache: false, // Disable memory cache to test file cache TTL
    })

    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult = {
      text: 'test response',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: mockTime,
    }

    const mockDoGenerate = vi.fn().mockResolvedValue(mockResult)

    const result1 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate,
      params: mockParams,
    })

    expect(result1).toEqual(mockResult)
    expect(mockDoGenerate).toHaveBeenCalledTimes(1)

    Date.now = vi.fn().mockReturnValue(mockTime + 2000) // 2 seconds later

    const mockDoGenerate2 = vi.fn().mockResolvedValue({
      ...mockResult,
      text: 'new response after expiration',
      timestamp: mockTime + 2000,
    })

    const result2 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate2,
      params: mockParams,
    })

    expect(result2.text).toBe('new response after expiration')
    expect(mockDoGenerate2).toHaveBeenCalledTimes(1)

    Date.now = realDateNow
  })

  it('should use memory cache when configured', async () => {
    const middleware = createCacheMiddleware({
      memoryCache: true,
      persistentCache: false,
    })
    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult = {
      text: 'test response',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    const mockDoGenerate = vi.fn().mockResolvedValue(mockResult)

    const result1 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate,
      params: mockParams,
    })
    expect(result1).toEqual(mockResult)
    expect(mockDoGenerate).toHaveBeenCalledTimes(1)
    expect(LRUCache).toHaveBeenCalled()

    const mockDoGenerate2 = vi.fn().mockImplementation(() => {
      throw new Error('Should not be called')
    })
    const result2 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate2,
      params: mockParams,
    })
    expect(result2).toEqual(mockResult)
    expect(mockDoGenerate2).not.toHaveBeenCalled()
  })

  it('should use file cache when configured', async () => {
    const middleware = createCacheMiddleware({
      memoryCache: false,
      persistentCache: true,
    })
    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult = {
      text: 'test response',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    const mockDoGenerate = vi.fn().mockResolvedValue(mockResult)

    const result1 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate,
      params: mockParams,
    })
    expect(result1).toEqual(mockResult)
    expect(mockDoGenerate).toHaveBeenCalledTimes(1)
    expect(LRUCache).not.toHaveBeenCalled()

    const mockDoGenerate2 = vi.fn().mockImplementation(() => {
      throw new Error('Should not be called')
    })
    const result2 = await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate2,
      params: mockParams,
    })
    expect(result2).toEqual(mockResult)
    expect(mockDoGenerate2).not.toHaveBeenCalled()
  })

  it('should handle compression option', async () => {
    const middleware = createCacheMiddleware({ compression: true })
    const mockParams = createMockParams({
      temperature: 0.7,
      maxTokens: 100,
    })

    const mockResult = {
      text: 'test response',
      finishReason: 'stop',
      rawCall: {},
      usage: { promptTokens: 10, completionTokens: 5 },
      timestamp: expect.any(Number), // Add timestamp with flexible matcher
    }

    const mockDoGenerate = vi.fn().mockResolvedValue(mockResult)
    const fsWriteFileSpy = vi.spyOn(fs, 'writeFile')

    await (middleware.wrapGenerate as any)({
      doGenerate: mockDoGenerate,
      params: mockParams,
    })

    expect(fsWriteFileSpy).toHaveBeenCalled()
    const writeFileArgs = fsWriteFileSpy.mock.calls[0]
    expect(writeFileArgs[1]).not.toContain('  ') // No indentation in compressed JSON
  })
})
