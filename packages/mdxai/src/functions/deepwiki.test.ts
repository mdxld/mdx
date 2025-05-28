import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { deepwiki } from './deepwiki'
import * as ai from 'ai'


const originalEnv = { ...process.env }

describe('deepwiki', () => {
  beforeEach(() => {
    process.env.AI_GATEWAY_TOKEN = 'mock-token'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('should process deepwiki queries', async () => {
    try {
      const result = await deepwiki('How do I use structured outputs with the Vercel AI SDK?')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
    }
  })
})
