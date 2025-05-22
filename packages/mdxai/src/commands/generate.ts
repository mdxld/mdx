import * as fs from 'fs'
import * as path from 'path'
import { CoreMessage } from 'ai'
import { generateContentStream } from '../llmService.js'

export interface GenerateCommandOptions {
  output?: string
  type: string
  json?: boolean
}

export const generate = async (prompt: string, options: GenerateCommandOptions) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      const msg = 'OPENAI_API_KEY environment variable is not set.'
      if (options.json) {
        console.error(JSON.stringify({ status: 'error', message: msg }))
      } else {
        console.error(msg)
      }
      process.exit(1)
    }

    let systemMessage: string | undefined

    switch (options.type.toLowerCase()) {
      case 'title':
        systemMessage = 'You are an expert copywriter. Generate a compelling blog post title based on the following topic.'
        break
      case 'outline':
        systemMessage = 'You are a content strategist. Generate a blog post outline based on the following topic/prompt.'
        break
      case 'draft':
      default:
        systemMessage = 'You are a helpful AI assistant. Generate a Markdown draft based on the following prompt.'
        break
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tool_choice?: any; tool_calls?: any }> = []
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage })
    }
    messages.push({ role: 'user', content: prompt })

    const coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant', // Cast to specific roles
      content: msg.content,
    }))

    const result = await generateContentStream({ messages: coreMessages })

    if (options.output) {
      const outputPath = path.resolve(options.output) // Resolve to absolute path
      const writer = fs.createWriteStream(outputPath)
      for await (const delta of result.textStream) {
        writer.write(delta)
      }
      writer.end()
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })
      if (options.json) {
        console.log(JSON.stringify({ status: 'success', outputFile: outputPath }))
      } else {
        console.log(`Content successfully written to ${outputPath}`)
      }
    } else {
      let buffer = ''
      for await (const delta of result.textStream) {
        if (options.json) {
          buffer += delta
        } else {
          process.stdout.write(delta)
        }
      }
      if (options.json) {
        console.log(JSON.stringify({ status: 'success', content: buffer }))
      } else {
        process.stdout.write('\n') // Add a newline at the end for stdout
      }
    }
  } catch (error) {
    if (options.json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during AI generation:', error)
    }
    process.exit(1)
  }
}
