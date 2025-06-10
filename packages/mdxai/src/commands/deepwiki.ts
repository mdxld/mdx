import * as fs from 'fs'
import * as path from 'path'
import { generateDeepwikiStream } from '../llmService.js'
import { extractH1Title, slugifyString, ensureDirectoryExists } from '../utils.js'

export async function runDeepwikiCommand(query: string) {
  const { json } = getGlobalOptions()
  
  try {
    if (!process.env.AI_GATEWAY_TOKEN) {
      const msg = 'AI_GATEWAY_TOKEN environment variable is not set.'
      if (json) {
        console.error(JSON.stringify({ status: 'error', message: msg }))
      } else {
        console.error(msg)
      }
      process.exit(1)
    }

    const result = await generateDeepwikiStream(query)

    let completeContent = ''
    for await (const delta of result.textStream) {
      if (!json) {
        process.stdout.write(delta)
      }
      completeContent += delta
    }

    if (!json) {
      process.stdout.write('\n')
    }

    const title = extractH1Title(completeContent) || query
    const slugifiedTitle = slugifyString(title)

    ensureDirectoryExists('research')

    const outputPath = path.resolve(`research/${slugifiedTitle}.md`)
    fs.writeFileSync(outputPath, completeContent)

    if (json) {
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
    if (json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during deepwiki generation:', error)
    }
    process.exit(1)
  }
}

function getGlobalOptions(): { json: boolean } {
  return { json: process.argv.includes('--json') }
}
