import { generateText } from 'ai'
import { model } from '../ai'
import dedent from 'dedent'
import { QueueManager } from '../ui/index.js'
import { scrape, ScrapedContent } from './scrape.js'

export const research = async (query: string) => {
  const result = await generateText({
    model: model('perplexity/sonar-deep-research'),
    prompt: `research ${query}`,
  })

  const body = result.response.body as any
  const citations = body.citations
  const reasoning = body.choices[0]?.message.reasoning

  const queue = new QueueManager(5) // Process 5 citations at a time

  const scrapedCitations: ScrapedContent[] = await Promise.all(
    citations.map(async (url: string, index: number) => {
      try {
        const scrapeResult = await queue.addTask(`Scraping citation ${index + 1}: ${url}`, async () => {
          return await scrape(url)
        })

        return scrapeResult
      } catch (error) {
        console.error(`Error processing citation ${index + 1}:`, error)
        return { 
          url, 
          error: error instanceof Error ? error.message : String(error),
          cached: false 
        } as ScrapedContent
      }
    }),
  )

  let text = result?.text || ''

  const toSuperscript = (num: number): string => {
    const superscriptMap: Record<string, string> = {
      '1': '¹',
      '2': '²',
      '3': '³',
      '4': '⁴',
      '5': '⁵',
      '6': '⁶',
      '7': '⁷',
      '8': '⁸',
      '9': '⁹',
      '0': '⁰',
    }

    return num
      .toString()
      .split('')
      .map((digit) => superscriptMap[digit] || digit)
      .join('')
  }

  for (let i = 0; i < citations.length; i++) {
    const citationNumber = i + 1
    const citationRegex = new RegExp(`\\[${citationNumber}\\]`, 'g')
    text = text.replace(citationRegex, `[ ${toSuperscript(citationNumber)} ](#${citationNumber})`)
  }

  let markdown = text + '\n\n'

  scrapedCitations.forEach((citation, index) => {
    const citationNumber = index + 1

    let summary = citation.title ? `**${citation.title}**` : citation.url
    if (citation.description) {
      summary += `\n\n${citation.description}`
    }
    if (citation.image) {
      summary += `\n\n![${citation.title || 'Citation image'}](${citation.image})`
    }

    markdown +=
      dedent`
      <details id="${citationNumber}">
        <summary>${summary}</summary>
        ${citation.error ? `Error: ${citation.error}` : citation.markdown || 'No content available'}
      </details>
    ` + '\n\n'
  })

  if (reasoning) {
    markdown += dedent`
      <details>
        <summary>Reasoning</summary>
        ${reasoning}
      </details>
    `
  }

  return {
    text: result?.text || '',
    markdown,
    citations,
    reasoning,
    scrapedCitations,
  }
}
