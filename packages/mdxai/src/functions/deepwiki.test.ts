import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { deepwiki } from './deepwiki'

describe('deepwiki', () => {
  it('should know recent knowledge', async () => {
    expect(process.env.AI_GATEWAY_TOKEN).toBeDefined()
    const result = await deepwiki('How do I use structured outputs with the Vercel AI SDK?')
    expect(result).toMatchInlineSnapshot(`""`)
  })
}, 90000)