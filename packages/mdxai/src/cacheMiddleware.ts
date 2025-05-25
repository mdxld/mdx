import { LanguageModelV1Middleware, LanguageModelV1StreamPart } from 'ai'
import { promises as fs } from 'fs'
import { join } from 'path'
import hash from 'object-hash'

const CACHE_DIR = join(process.cwd(), '.ai/cache')

export const createCacheMiddleware = (): LanguageModelV1Middleware => {
  return {
    wrapGenerate: async ({ doGenerate, params }) => {
      const cacheKey = hash(params)
      const cacheFilePath = join(CACHE_DIR, `${cacheKey}.json`)

      try {
        const cachedData = await fs.readFile(cacheFilePath, 'utf-8')
        const cachedResult = JSON.parse(cachedData)
        console.log(`Cache hit for key: ${cacheKey}`)
        return cachedResult
      } catch (error) {
        console.log(`Cache miss for key: ${cacheKey}`)
      }

      const result = await doGenerate()

      try {
        await fs.mkdir(CACHE_DIR, { recursive: true })
        await fs.writeFile(cacheFilePath, JSON.stringify(result, null, 2))
        console.log(`Cached result for key: ${cacheKey}`)
      } catch (error) {
        console.warn(`Failed to cache result: ${error}`)
      }

      return result
    },

    wrapStream: async ({ doStream, params }) => {
      const cacheKey = hash(params)
      const cacheFilePath = join(CACHE_DIR, `${cacheKey}.json`)

      try {
        const cachedData = await fs.readFile(cacheFilePath, 'utf-8')
        const cachedResult = JSON.parse(cachedData)
        console.log(`Cache hit for streaming key: ${cacheKey}`)
        
        const text = cachedResult.text || ''
        const stream = new ReadableStream({
          start(controller) {
            for (const char of text) {
              controller.enqueue({ 
                type: 'text-delta' as const, 
                textDelta: char 
              })
            }
            controller.enqueue({ type: 'finish' as const })
            controller.close()
          }
        })

        return {
          stream,
          text: cachedResult.text || '',
          ...cachedResult
        }
      } catch (error) {
        console.log(`Cache miss for streaming key: ${cacheKey}`)
      }

      const { stream, ...rest } = await doStream()
      let fullText = ''
      
      const transformStream = new TransformStream<
        LanguageModelV1StreamPart,
        LanguageModelV1StreamPart
      >({
        transform(chunk, controller) {
          if (chunk.type === 'text-delta') {
            fullText += chunk.textDelta
          }
          controller.enqueue(chunk)
        },
        async flush() {
          try {
            await fs.mkdir(CACHE_DIR, { recursive: true })
            const cacheData = {
              text: fullText,
              ...rest
            }
            await fs.writeFile(cacheFilePath, JSON.stringify(cacheData, null, 2))
            console.log(`Cached streaming result for key: ${cacheKey}`)
          } catch (error) {
            console.warn(`Failed to cache streaming result: ${error}`)
          }
        }
      })

      return {
        stream: stream.pipeThrough(transformStream),
        ...rest
      }
    }
  }
}
