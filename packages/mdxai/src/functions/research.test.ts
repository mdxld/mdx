import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { research } from './research'

describe('research', () => {
  it('should know recent knowledge', async () => {
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
    expect(result.reasoning).toMatchInlineSnapshot(`
      "Okay, I need to figure out how to use structured outputs with the Vercel AI SDK. Let me start by looking at the search results provided. 

      First, from the Vercel documentation (results 1 and 2), it seems there are functions like generateObject and streamObject that help in generating structured data. They mention using Zod schemas or JSON schemas to define the structure. That's a good starting point. The examples show how to generate a recipe using a Zod schema, which includes nested objects and arrays. 

      Result 3 discusses combining generateText with structured output and useChat. It mentions an experimental_output feature. Wait, so there's a way to use structured outputs even with generateText? That might be useful if someone is already using generateText and wants to add structured data without switching functions. But the user is asking specifically about structured outputs, so I should cover both generateObject and the experimental features in generateText.

      Result 4 talks about tool calling. Tools are functions the model can use, and they also involve schemas. The example shows using a weather tool with parameters defined by Zod. This is relevant because structured outputs might be used alongside tools. The blog post in result 6 mentions that AI SDK 4.1 allows combining structured outputs with tools, which is a key point. So, in the report, I should explain how structured outputs can work with tools in a single call, improving efficiency.

      Result 5 is a video tutorial. It probably demonstrates using generateObject with Zod schemas, emphasizing the ease of getting structured data. The transcript snippet mentions generating a recipe and streaming the object. This reinforces the documentation examples.

      Result 9 and 10 provide more examples of generateObject and streamObject. They show generating arrays and using different schemas. The client-server example in result 10 is helpful for showing how to implement this in a Next.js app, both client and server-side. Including code snippets here would be beneficial.

      Result 11 introduces the useObject hook for React, allowing real-time streaming of structured data to the UI. This is important for applications needing dynamic updates. The example with notifications demonstrates practical use.

      Result 12 details streamObject, which streams partial objects. This is useful for progressive rendering. The examples show how to handle arrays and schema-less JSON, which adds flexibility.

      Result 13 and 14 discuss using JSON schemas and Valibot as alternatives to Zod. This is important for users who might prefer different schema libraries or have dynamic schemas.

      Result 15 is an error case with Google's model, indicating that structured outputs might have compatibility issues with certain providers. I should note that structured outputs with tools are currently only available for OpenAI models, as mentioned in result 6.

      Result 16 and 17 are GitHub discussions. They highlight community issues and solutions, like enabling structured outputs in OpenAI models and handling enums. This points to potential pitfalls and best practices when defining schemas.

      Putting this all together, the report should start with an introduction to structured outputs, then cover the core functions (generateObject, streamObject), schema types (Zod, JSON, Valibot), combining with tools, client-server implementation, streaming to UI, and considerations like model compatibility and schema design. Including code examples from the results will make it practical. Also, mentioning experimental features and community discussions adds depth.
      "
    `)
  })
}, 90000)