import * as fs from 'fs'
import * as path from 'path'
import { CoreMessage } from 'ai'
import { generateContentStream } from '../llmService.js'

export interface EditCommandOptions {
  output?: string
  json?: boolean
}

export const edit = async (filepath: string, instruction: string, options: EditCommandOptions) => {
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

    if (!fs.existsSync(filepath)) {
      const msg = `Error: Input file not found at ${filepath}`
      if (options.json) {
        console.error(JSON.stringify({ status: 'error', message: msg }))
      } else {
        console.error(msg)
      }
      process.exit(1)
    }

    const originalContent = fs.readFileSync(filepath, 'utf-8')

    const messages: CoreMessage[] = [
      {
        role: 'system',
        content:
          "You are an expert text editor. Apply the user's editing instruction to the provided text. Only output the modified text, without any additional commentary or conversational filler.",
      },
      { role: 'user', content: `Editing Instruction: ${instruction}\n\nOriginal Text:\n${originalContent}` },
    ]

    const result = await generateContentStream({ messages: messages })

    const targetFilepath = options.output ? path.resolve(options.output) : path.resolve(filepath)
    const tempFilepath = targetFilepath + '.tmp'
    const writer = fs.createWriteStream(tempFilepath)

    try {
      for await (const delta of result.textStream) {
        writer.write(delta)
      }
      writer.end()

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve())
        writer.on('error', (err) => reject(err))
      })

      fs.renameSync(tempFilepath, targetFilepath)
      if (options.json) {
        console.log(JSON.stringify({ status: 'success', outputFile: targetFilepath }))
      } else {
        console.log(`Content successfully edited and saved to ${targetFilepath}`)
      }
    } catch (e: any) {
      if (fs.existsSync(tempFilepath)) {
        fs.unlinkSync(tempFilepath)
      }
      if (options.json) {
        console.error(JSON.stringify({ status: 'error', message: String(e) }))
      } else {
        console.error(`Error editing file ${targetFilepath}:`, e)
      }
      process.exit(1)
    }
  } catch (error) {
    if (options.json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during AI edit operation:', error)
    }
    process.exit(1)
  }
}
