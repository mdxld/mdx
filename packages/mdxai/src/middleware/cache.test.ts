import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createCacheMiddleware, CacheConfig } from './cache'
import { promises as fs } from 'fs'
import { join } from 'path'

const TEST_CACHE_DIR = join(process.cwd(), '.ai/test-cache')

describe('createCacheMiddleware', () => {
  beforeEach(async () => {
    try {
      await fs.rm(TEST_CACHE_DIR, { recursive: true, force: true })
    } catch (error) {
    }
  })

  afterEach(async () => {
    try {
      await fs.rm(TEST_CACHE_DIR, { recursive: true, force: true })
    } catch (error) {
    }
  })

  it('should create middleware with default config', () => {
    const middleware = createCacheMiddleware()
    expect(middleware).toBeDefined()
    expect(middleware.wrapGenerate).toBeDefined()
    expect(middleware.wrapStream).toBeDefined()
  })

  it('should create disabled middleware when enabled is false', () => {
    const config: CacheConfig = { enabled: false }
    const middleware = createCacheMiddleware(config)
    expect(middleware).toBeDefined()
    expect(middleware.wrapGenerate).toBeDefined()
    expect(middleware.wrapStream).toBeDefined()
  })

  it('should handle custom TTL configuration', () => {
    const config: CacheConfig = {
      ttl: 1000, // 1 second
      maxSize: 50,
      persistentCache: false,
      memoryCache: true,
    }
    const middleware = createCacheMiddleware(config)
    expect(middleware).toBeDefined()
  })

  it('should handle memory-only cache configuration', () => {
    const config: CacheConfig = {
      persistentCache: false,
      memoryCache: true,
    }
    const middleware = createCacheMiddleware(config)
    expect(middleware).toBeDefined()
  })

  it('should handle file-only cache configuration', () => {
    const config: CacheConfig = {
      persistentCache: true,
      memoryCache: false,
    }
    const middleware = createCacheMiddleware(config)
    expect(middleware).toBeDefined()
  })

  it('should handle compression configuration', () => {
    const config: CacheConfig = {
      compression: true,
    }
    const middleware = createCacheMiddleware(config)
    expect(middleware).toBeDefined()
  })
})
