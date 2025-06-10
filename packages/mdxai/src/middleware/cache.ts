import { LanguageModelV1Middleware, LanguageModelV1StreamPart } from 'ai'
import { promises as fs } from 'fs'
import { join } from 'path'
import hash from 'object-hash'
import { LRUCache } from 'lru-cache'

const CACHE_DIR = join(process.cwd(), '.ai/cache')

/**
 * Configuration options for the cache middleware
 */
export interface CacheConfig {
  /** Enable/disable caching entirely */
  enabled?: boolean
  /** TTL in milliseconds for cache entries (default: 24 hours) */
  ttl?: number
  /** Maximum number of entries in LRU cache (default: 100) */
  maxSize?: number
  /** Enable file-based persistent cache (default: true) */
  persistentCache?: boolean
  /** Enable in-memory LRU cache (default: true) */
  memoryCache?: boolean
  /** Enable compression for large responses (default: false) */
  compression?: boolean
}

interface CachedData {
  text: string
  finishReason?: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
  rawCall?: any
  timestamp: number // Add timestamp for TTL validation
}

/**
 * Helper function to clean up expired cache files
 */
const cleanupExpiredFiles = async (cacheDir: string, ttl: number) => {
  try {
    const files = await fs.readdir(cacheDir)
    const now = Date.now()

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(cacheDir, file)
        try {
          const stat = await fs.stat(filePath)

          if (now - stat.mtime.getTime() > ttl) {
            await fs.unlink(filePath)
          }
        } catch (error) {}
      }
    }
  } catch (error) {
    console.warn(`Cache cleanup error: ${error}`)
  }
}

/**
 * Creates a caching middleware for AI responses
 */
export const createCacheMiddleware = (config: CacheConfig = {}): LanguageModelV1Middleware => {
  const {
    enabled = true,
    ttl = 24 * 60 * 60 * 1000, // 24 hours
    maxSize = 100,
    persistentCache = true,
    memoryCache = true,
    compression = false,
  } = config

  if (!enabled) {
    return {
      wrapGenerate: async ({ doGenerate }) => doGenerate(),
      wrapStream: async ({ doStream }) => doStream(),
    }
  }

  const lruCache = memoryCache
    ? new LRUCache<string, any>({
        max: maxSize,
        ttl: ttl,
      })
    : null

  if (persistentCache && ttl > 0) {
    setInterval(
      () => {
        cleanupExpiredFiles(CACHE_DIR, ttl).catch(() => {})
      },
      Math.min(ttl, 24 * 60 * 60 * 1000),
    ) // Run at least once per day
  }

  return {
    wrapGenerate: async ({ doGenerate, params }) => {
      const cacheKey = hash(params)
      const cacheFilePath = join(CACHE_DIR, `${cacheKey}.json`)
      const now = Date.now()

      if (memoryCache && lruCache) {
        const cachedResult = lruCache.get(cacheKey)
        if (cachedResult) {
          console.log(`Memory cache hit for key: ${cacheKey}`)
          return cachedResult
        }
      }

      if (persistentCache) {
        try {
          const cachedData = await fs.readFile(cacheFilePath, 'utf-8')
          const cachedResult = JSON.parse(cachedData)

          if (cachedResult.timestamp && now - cachedResult.timestamp > ttl) {
            console.log(`Cache expired for key: ${cacheKey}`)
            throw new Error('Cache expired')
          }

          console.log(`File cache hit for key: ${cacheKey}`)

          if (memoryCache && lruCache) {
            lruCache.set(cacheKey, cachedResult)
          }

          return cachedResult
        } catch (error) {
          console.log(`File cache miss for key: ${cacheKey}`)
        }
      }

      const result = await doGenerate()

      const resultWithTimestamp = {
        ...result,
        timestamp: now,
      }

      if (memoryCache && lruCache) {
        lruCache.set(cacheKey, resultWithTimestamp)
      }

      if (persistentCache) {
        try {
          await fs.mkdir(CACHE_DIR, { recursive: true })
          await fs.writeFile(cacheFilePath, compression ? JSON.stringify(resultWithTimestamp) : JSON.stringify(resultWithTimestamp, null, 2))
          console.log(`Cached result for key: ${cacheKey}`)
        } catch (error) {
          console.warn(`Failed to cache result: ${error}`)
        }
      }

      return result
    },

    wrapStream: async ({ doStream, params }) => {
      const cacheKey = hash(params)
      const cacheFilePath = join(CACHE_DIR, `${cacheKey}.json`)
      const now = Date.now()

      if (memoryCache && lruCache) {
        const cachedResult = lruCache.get(cacheKey) as CachedData | undefined
        if (cachedResult) {
          console.log(`Memory cache hit for streaming key: ${cacheKey}`)

          const text = cachedResult.text || ''
          const stream = new ReadableStream<LanguageModelV1StreamPart>({
            start(controller) {
              for (const char of text) {
                controller.enqueue({
                  type: 'text-delta' as const,
                  textDelta: char,
                })
              }
              controller.enqueue({
                type: 'finish' as const,
                finishReason: 'stop' as const,
                usage: cachedResult.usage || {
                  promptTokens: 0,
                  completionTokens: 0,
                },
              })
              controller.close()
            },
          })

          return {
            stream,
            rawCall: cachedResult.rawCall || {
              rawPrompt: {},
              rawSettings: {},
            },
          }
        }
      }

      if (persistentCache) {
        try {
          const cachedData = await fs.readFile(cacheFilePath, 'utf-8')
          const cachedResult = JSON.parse(cachedData) as CachedData

          if (cachedResult.timestamp && now - cachedResult.timestamp > ttl) {
            console.log(`Cache expired for streaming key: ${cacheKey}`)
            throw new Error('Cache expired')
          }

          console.log(`File cache hit for streaming key: ${cacheKey}`)

          if (memoryCache && lruCache) {
            lruCache.set(cacheKey, cachedResult)
          }

          const text = cachedResult.text || ''
          const stream = new ReadableStream<LanguageModelV1StreamPart>({
            start(controller) {
              for (const char of text) {
                controller.enqueue({
                  type: 'text-delta' as const,
                  textDelta: char,
                })
              }
              controller.enqueue({
                type: 'finish' as const,
                finishReason: 'stop' as const,
                usage: cachedResult.usage || {
                  promptTokens: 0,
                  completionTokens: 0,
                },
              })
              controller.close()
            },
          })

          return {
            stream,
            rawCall: cachedResult.rawCall || {
              rawPrompt: {},
              rawSettings: {},
            },
          }
        } catch (error) {
          console.log(`File cache miss for streaming key: ${cacheKey}`)
        }
      }

      const result = await doStream()
      const { stream } = result
      let fullText = ''
      let finishReason: string | undefined
      let usage: { promptTokens: number; completionTokens: number } | undefined

      const transformStream = new TransformStream<LanguageModelV1StreamPart, LanguageModelV1StreamPart>({
        transform(chunk, controller) {
          if (chunk.type === 'text-delta') {
            fullText += chunk.textDelta
          } else if (chunk.type === 'finish') {
            finishReason = chunk.finishReason
            usage = chunk.usage
          }
          controller.enqueue(chunk)
        },
        async flush() {
          const cacheData: CachedData = {
            text: fullText,
            finishReason,
            usage,
            rawCall: result.rawCall,
            timestamp: now,
          }

          if (memoryCache && lruCache) {
            lruCache.set(cacheKey, cacheData)
          }

          if (persistentCache) {
            try {
              await fs.mkdir(CACHE_DIR, { recursive: true })
              await fs.writeFile(cacheFilePath, compression ? JSON.stringify(cacheData) : JSON.stringify(cacheData, null, 2))
              console.log(`Cached streaming result for key: ${cacheKey}`)
            } catch (error) {
              console.warn(`Failed to cache streaming result: ${error}`)
            }
          }
        },
      })

      return {
        stream: stream.pipeThrough(transformStream),
        rawCall: result.rawCall,
      }
    },
  }
}
