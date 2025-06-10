import * as fs from 'fs'
import * as path from 'path'
import { generateResearchStream } from '../llmService.js'
import { extractH1Title, slugifyString, ensureDirectoryExists } from '../utils.js'
import { renderApp } from '../ui/app.js'

export interface ResearchOptions {
  output: string
  format: string
  ink: boolean
}

export async function runResearchCommand(prompt: string, options: ResearchOptions) {
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

    if (options.ink) {
      const unmount = renderApp('research', {
        prompt,
        output: options.output,
        format: options.format,
      })
      return
    }

    const result = await generateResearchStream(prompt)

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

    const title = extractH1Title(completeContent) || prompt
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
      console.error('Error during research generation:', error)
    }
    process.exit(1)
  }
}

function getGlobalOptions(): { json: boolean } {
  return { json: process.argv.includes('--json') }
}
