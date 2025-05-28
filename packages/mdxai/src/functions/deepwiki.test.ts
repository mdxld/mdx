import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { deepwiki } from './deepwiki'
import * as ai from 'ai'

vi.mock('ai')

const isCI = process.env.CI === 'true'

const originalEnv = { ...process.env }

const generateTextSpy = vi.fn().mockResolvedValue({
  text: 'This is a test response for deepwiki',
  response: {
    body: {},
  },
})
vi.spyOn(ai, 'generateText').mockImplementation((...args) => generateTextSpy(...args))

const modelSpy = vi.fn().mockReturnValue('mock-model')

const mockMCPClient = {
  tools: vi.fn().mockResolvedValue({
    read_wiki_structure: vi.fn(),
    read_wiki_page: vi.fn(),
  }),
}
const createMCPClientSpy = vi.fn().mockResolvedValue(mockMCPClient)
if ('experimental_createMCPClient' in ai) {
  vi.spyOn(ai, 'experimental_createMCPClient').mockImplementation(() => createMCPClientSpy())
}

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
