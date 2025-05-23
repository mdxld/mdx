import 'dotenv/config'
import { describe, expect, it, vi } from 'vitest'
import { research } from './research'

describe('research', () => {
  it('should know recent knowledge', async () => {
    expect(process.env.AI_GATEWAY_TOKEN).toBeDefined()
    
    vi.mock('ai', async () => {
      const actual = await vi.importActual('ai')
      return {
        ...actual,
        generateText: vi.fn().mockResolvedValue({
          text: 'Mocked response for research',
          response: {
            body: {
              citations: [
                "https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data",
                "https://vercel.com/docs/ai-sdk"
              ],
              choices: [
                {
                  message: {
                    reasoning: "Mocked reasoning for research"
                  }
                }
              ]
            }
          }
        })
      }
    })
    
    const result = await research('How do I use structured outputs with the Vercel AI SDK?')
    
    expect(result.text).toBe('Mocked response for research')
    expect(result.citations).toEqual([
      "https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data",
      "https://vercel.com/docs/ai-sdk"
    ])
    expect(result.reasoning).toBe("Mocked reasoning for research")
  })
}, 90000)
