import * as fs from 'fs'
import * as path from 'path'
import { generateListStream } from '../llmService.js'
import { renderApp } from '../ui/app.js'

export interface ListOptions {
  output: string
  format: string
  ink: boolean
}

export async function runListCommand(prompt: string, options: ListOptions) {
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

    if (options.ink) {
      const unmount = renderApp('list', {
        prompt,
        output: options.output,
        format: options.format,
      })
      return
    }

    const result = await generateListStream(prompt)

    const outputPath = path.resolve(options.output)
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

    let finalContent = ''

    switch (options.format.toLowerCase()) {
      case 'frontmatter':
        const listItems = completeContent
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /^\d+\./.test(line))
          .map((line) => line.replace(/^\d+\.\s*/, '').trim())

        finalContent = '---\nlist:\n'
        listItems.forEach((item) => {
          finalContent += `  - ${item}\n`
        })
        finalContent += '---\n'
        break

      case 'both':
        const bothListItems = completeContent
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /^\d+\./.test(line))
          .map((line) => line.replace(/^\d+\.\s*/, '').trim())

        finalContent = '---\nlist:\n'
        bothListItems.forEach((item) => {
          finalContent += `  - ${item}\n`
        })
        finalContent += '---\n\n'
        finalContent += completeContent
        break

      case 'markdown':
      default:
        finalContent = completeContent
        break
    }

    fs.writeFileSync(outputPath, finalContent)

    if (json) {
      console.log(
        JSON.stringify({
          status: 'success',
          outputFile: outputPath,
          content: completeContent,
        }),
      )
    } else {
      console.log(`List successfully written to ${outputPath}`)
    }
  } catch (error) {
    if (json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during list generation:', error)
    }
    process.exit(1)
  }
}

function getGlobalOptions(): { json: boolean } {
  return { json: process.argv.includes('--json') }
}
