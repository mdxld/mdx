import { CoreMessage } from 'ai'
import * as fs from 'fs'
import * as path from 'path'
import { generateContentStream } from '../llmService.js'
import { renderApp } from '../ui/app.js'
import { extractH1Title, slugifyString, extractFirstWords } from '../utils.js'

export interface GenerateOptions {
  output?: string
  type: string
  ink: boolean
}

export async function runGenerateCommand(prompt: string, options: GenerateOptions) {
  const { json } = getGlobalOptions()

  try {
    if (!process.env.OPENAI_API_KEY) {
      const msg = 'OPENAI_API_KEY environment variable is not set.'
      if (json) {
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

    if (options.ink) {
      const unmount = renderApp('generate', {
        prompt,
        systemMessage,
        output: options.output,
      })
      return
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tool_choice?: any; tool_calls?: any }> = []
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage })
    }
    messages.push({ role: 'user', content: prompt })

    const coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }))

    const result = await generateContentStream({ messages: coreMessages })

    if (options.output) {
      const outputPath = path.resolve(options.output)
      const writer = fs.createWriteStream(outputPath)
      for await (const delta of result.textStream) {
        writer.write(delta)
      }
      writer.end()
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })
      if (json) {
        console.log(JSON.stringify({ status: 'success', outputFile: outputPath }))
      } else {
        console.log(`Content successfully written to ${outputPath}`)
      }
    } else {
      let completeContent = ''
      for await (const delta of result.textStream) {
        if (json) {
          completeContent += delta
        } else {
          process.stdout.write(delta)
          completeContent += delta
        }
      }

      const title = extractH1Title(completeContent) || extractFirstWords(completeContent) || 'generated'
      const slugifiedTitle = slugifyString(title)
      const outputPath = path.resolve(`${slugifiedTitle}.md`)

      fs.writeFileSync(outputPath, completeContent)

      if (json) {
        console.log(JSON.stringify({ status: 'success', outputFile: outputPath, content: completeContent }))
      } else {
        process.stdout.write('\n')
        console.log(`Content successfully written to ${outputPath}`)
      }
    }
  } catch (error) {
    if (json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during AI generation:', error)
    }
    process.exit(1)
  }
}

function getGlobalOptions(): { json: boolean } {
  return { json: process.argv.includes('--json') }
}
