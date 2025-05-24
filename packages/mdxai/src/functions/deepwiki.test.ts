import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { deepwiki } from './deepwiki'

const isCI = process.env.CI === 'true'

const originalEnv = { ...process.env }

vi.mock('ai', () => {
  return {
    generateText: vi.fn().mockResolvedValue({
      text: 'This is a test response for deepwiki',
      response: {
        body: {},
      },
    }),
    model: vi.fn().mockReturnValue('mock-model'),
    experimental_createMCPClient: vi.fn().mockResolvedValue({
      tools: vi.fn().mockResolvedValue({
        read_wiki_structure: vi.fn(),
        read_wiki_page: vi.fn(),
      }),
    }),
  }
})

describe('deepwiki', () => {
  beforeEach(() => {
    process.env.AI_GATEWAY_TOKEN = 'mock-token'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('should process deepwiki queries', async () => {
    const result = await deepwiki('How do I use structured outputs with the Vercel AI SDK?')
    expect(result).toBeDefined()
  })
})
