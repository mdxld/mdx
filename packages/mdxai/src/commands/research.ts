import * as fs from 'fs'
import * as path from 'path'
import { generateResearchStream } from '../llmService.js'

export interface ResearchCommandOptions {
  output: string
  format: string
  json?: boolean
}

export const research = async (prompt: string, options: ResearchCommandOptions) => {
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

    const result = await generateResearchStream(prompt)

    const outputPath = path.resolve(options.output)
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

    let finalContent = ''

    switch (options.format.toLowerCase()) {
      case 'frontmatter':
        const researchItems = completeContent
          .split('\n\n')
          .map((paragraph) => paragraph.trim())
          .filter((paragraph) => paragraph !== '')

        finalContent = '---\nresearch:\n'
        researchItems.forEach((item) => {
          finalContent += `  - |\n    ${item.replace(/\n/g, '\n    ')}\n`
        })
        finalContent += '---\n'
        break

      case 'both':
        const bothResearchItems = completeContent
          .split('\n\n')
          .map((paragraph) => paragraph.trim())
          .filter((paragraph) => paragraph !== '')

        finalContent = '---\nresearch:\n'
        bothResearchItems.forEach((item) => {
          finalContent += `  - |\n    ${item.replace(/\n/g, '\n    ')}\n`
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
      console.error('Error during research generation:', error)
    }
    process.exit(1)
  }
}
