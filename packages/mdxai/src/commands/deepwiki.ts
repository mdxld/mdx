import * as fs from 'fs'
import * as path from 'path'
import { generateDeepwikiStream } from '../llmService.js'
import { extractH1Title, slugifyString, ensureDirectoryExists } from '../utils.js'

export interface DeepwikiCommandOptions {
  json?: boolean
}

export const deepwiki = async (query: string, options: DeepwikiCommandOptions) => {
  try {
    if (!process.env.AI_GATEWAY_TOKEN) {
      const msg = 'AI_GATEWAY_TOKEN environment variable is not set.'
      if (options.json) {
        console.error(JSON.stringify({ status: 'error', message: msg }))
      } else {
        console.error(msg)
      }
      process.exit(1)
    }

    const result = await generateDeepwikiStream(query)

    let completeContent = ''
    for await (const delta of result.textStream) {
      if (!options.json) {
        process.stdout.write(delta)
      }
      completeContent += delta
    }

    if (!options.json) {
      process.stdout.write('\n') // Add a newline at the end for stdout
    }

    const title = extractH1Title(completeContent) || query
    const slugifiedTitle = slugifyString(title)
    
    ensureDirectoryExists('research')
    
    const outputPath = path.resolve(`research/${slugifiedTitle}.md`)
    fs.writeFileSync(outputPath, completeContent)

    if (options.json) {
      console.log(
        JSON.stringify({
          status: 'success',
          outputFile: outputPath,
          content: completeContent,
        }),
      )
    } else {
      console.log(`Research successfully written to ${outputPath}`)
    }
  } catch (error) {
    if (options.json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during deepwiki generation:', error)
    }
    process.exit(1)
  }
}
