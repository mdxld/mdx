import { LanguageModelV1Middleware, LanguageModelV1StreamPart } from 'ai'
import { promises as fs } from 'fs'
import { join } from 'path'
import { stringify as yamlStringify } from 'yaml'

const LOG_DIR = join(process.cwd(), '.ai/logs')

/**
 * Configuration options for the logging middleware
 */
export interface LoggingConfig {
  /** Enable/disable logging entirely */
  enabled?: boolean
  /** Directory to save log files (default: .ai/logs) */
  logDir?: string
  /** Maximum length of prompt prefix for filename (default: 50) */
  maxPromptLength?: number
}

/**
 * Sanitizes a string for use in filenames
 */
const sanitizeFilename = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50)
}

/**
 * Extracts prompt text from params
 */
const extractPrompt = (params: any): string => {
  if (typeof params.prompt === 'string') {
    return params.prompt
  }
  if (Array.isArray(params.messages) && params.messages.length > 0) {
    const lastMessage = params.messages[params.messages.length - 1]
    if (typeof lastMessage.content === 'string') {
      return lastMessage.content
    }
  }
  return 'unknown-prompt'
}

/**
 * Detects if the result is from generateObject vs generateText
 */
const isGenerateObjectResult = (result: any): boolean => {
  return result && typeof result.text === 'undefined' && (result.reasoning || result.files || result.experimental_providerMetadata)
}

/**
 * Creates a logging middleware for AI requests/responses
 */
export const createLoggingMiddleware = (config: LoggingConfig = {}): LanguageModelV1Middleware => {
  const {
    enabled = true,
    logDir = LOG_DIR,
    maxPromptLength = 50,
  } = config

  if (!enabled) {
    return {
      wrapGenerate: async ({ doGenerate }) => doGenerate(),
      wrapStream: async ({ doStream }) => doStream(),
    }
  }

  return {
    wrapGenerate: async ({ doGenerate, params }) => {
      const timestamp = Date.now()
      const prompt = extractPrompt(params)
      const promptPrefix = sanitizeFilename(prompt.substring(0, maxPromptLength))
      const filename = `${timestamp}-${promptPrefix}.md`
      const filePath = join(logDir, filename)

      const result = await doGenerate()

      try {
        await fs.mkdir(logDir, { recursive: true })

        const isObjectResult = isGenerateObjectResult(result)
        const frontmatter: any = {
          timestamp: new Date(timestamp).toISOString(),
          model: 'unknown',
          prompt: prompt,
          type: isObjectResult ? 'generateObject' : 'generateText',
        }

        let content = ''
        if (isObjectResult) {
          frontmatter.response = result
        } else {
          content = result.text || ''
        }

        const yamlFrontmatter = yamlStringify(frontmatter)
        const fileContent = `---\n${yamlFrontmatter}---\n\n${content}`

        await fs.writeFile(filePath, fileContent, 'utf-8')
        console.log(`Logged AI request/response to: ${filename}`)
      } catch (error) {
        console.warn(`Failed to log AI request/response: ${error}`)
      }

      return result
    },

    wrapStream: async ({ doStream, params }) => {
      const timestamp = Date.now()
      const prompt = extractPrompt(params)
      const promptPrefix = sanitizeFilename(prompt.substring(0, maxPromptLength))
      const filename = `${timestamp}-${promptPrefix}.md`
      const filePath = join(logDir, filename)

      const result = await doStream()
      const { stream } = result
      let fullText = ''
      let finishReason: string | undefined
      let usage: { promptTokens: number; completionTokens: number } | undefined

      const transformStream = new TransformStream<LanguageModelV1StreamPart, LanguageModelV1StreamPart>({
        transform(chunk, controller) {
          if (chunk.type === 'text-delta') {
            fullText += chunk.textDelta
          } else if (chunk.type === 'finish') {
            finishReason = chunk.finishReason
            usage = chunk.usage
          }
          controller.enqueue(chunk)
        },
        async flush() {
          try {
            await fs.mkdir(logDir, { recursive: true })

            const frontmatter: any = {
              timestamp: new Date(timestamp).toISOString(),
              model: 'unknown',
              prompt: prompt,
              type: 'generateText',
              finishReason,
              usage,
            }

            const yamlFrontmatter = yamlStringify(frontmatter)
            const fileContent = `---\n${yamlFrontmatter}---\n\n${fullText}`

            await fs.writeFile(filePath, fileContent, 'utf-8')
            console.log(`Logged AI streaming request/response to: ${filename}`)
          } catch (error) {
            console.warn(`Failed to log AI streaming request/response: ${error}`)
          }
        },
      })

      return {
        stream: stream.pipeThrough(transformStream),
        rawCall: result.rawCall,
      }
    },
  }
}
