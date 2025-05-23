import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { research } from './research'

const isCI = process.env.CI === 'true'

describe('research', () => {
  ;(isCI ? it.skip : it)('should know recent knowledge', async () => {
    expect(process.env.AI_GATEWAY_TOKEN).toBeDefined()
    
    const result = await research('How do I use structured outputs with the Vercel AI SDK?')
    expect(result.citations).toMatchInlineSnapshot(`
      [
        "https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data",
        "https://vercel.com/docs/ai-sdk",
        "https://github.com/vercel/ai/discussions/3323",
        "https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling",
        "https://www.youtube.com/watch?v=mojZpktAiYQ",
        "https://vercel.com/blog/ai-sdk-4-1",
        "https://www.youtube.com/watch?v=UIMG1kFiWa4",
        "https://vercel.com/blog/vercel-ai-sdk-3-3",
        "https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object",
        "https://sdk.vercel.ai/cookbook/next/generate-object",
        "https://sdk.vercel.ai/docs/ai-sdk-ui/object-generation",
        "https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object",
        "https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema",
        "https://ai-sdk.dev/docs/reference/ai-sdk-core/valibot-schema",
        "https://community.vercel.com/t/error-with-ai-sdk-google-using-streamtext/8312",
        "https://github.com/vercel/ai/issues/2573",
        "https://github.com/vercel/ai/discussions/4207",
        "https://stackoverflow.blog/2024/06/14/vercel-next-node-js-ai-sdk/",
      ]
    `)
  })
}, 90000)
