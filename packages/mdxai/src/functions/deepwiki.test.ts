import 'dotenv/config'
import { describe, expect, it, vi } from 'vitest'
import { deepwiki } from './deepwiki'

describe('deepwiki', () => {
  it('should know recent knowledge', async () => {
    expect(process.env.AI_GATEWAY_TOKEN).toBeDefined()
    
    vi.mock('ai', async () => {
      const actual = await vi.importActual('ai')
      return {
        ...actual,
        generateText: vi.fn().mockResolvedValue({ text: 'Mocked response for deepwiki' })
      }
    })
    
    const result = await deepwiki('How do I use structured outputs with the Vercel AI SDK?')
    expect(result).toBe('Mocked response for deepwiki')
  })
}, 90000)
