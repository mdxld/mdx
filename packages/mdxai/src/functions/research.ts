import { generateText } from 'ai'
import { createAIModel } from '../ai'
import dedent from 'dedent'
import { QueueManager } from '../ui/index.js'
import { scrape, ScrapedContent } from './scrape.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

export type ResearchResult = {
  text: string
  markdown: string
  citations: string[]
  reasoning: string
}

/**
 * Research template literal function for external data gathering
 *
 * Usage: await research`${market} in the context of delivering ${idea}`
 */
export type ResearchTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<ResearchResult>


const queue = new QueueManager(25) // Process 25 citations at a time

/**
 * Core research function that takes a query string and returns research results
 */
async function researchCore(query: string, apiKey?: string, baseURL?: string): Promise<ResearchResult> {
  const aiModel = createAIModel(apiKey, baseURL)
  const result = await generateText({
    model: aiModel('perplexity/sonar-deep-research'),
    prompt: `Research ${query}`,
  })


  // Handle potential undefined response property
  const body = result?.response?.body as any || {}
  const citations = body.citations || []
  const reasoning = body.choices?.[0]?.message?.reasoning || ''

  console.log(body.choices?.[0]?.message)

  // const scrapedCitations: ScrapedContent[] = await Promise.all(
  //   citations.map(async (url: string, index: number) => {
  //     try {
  //       const scrapeResult = await queue.addTask(`Scraping citation ${index + 1}: ${url}`, async () => {
  //         return await scrape(url)
  //       })

  //       return scrapeResult
  //     } catch (error) {
  //       console.error(`Error processing citation ${index + 1}:`, error)
  //       return { 
  //         url, 
  //         error: error instanceof Error ? error.message : String(error),
  //         cached: false 
  //       } as ScrapedContent
  //     }
  //   }),
  // )

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

  // scrapedCitations.forEach((citation, index) => {
  //   const citationNumber = index + 1

  //   let summary = citation.title ? `**${citation.title}**` : citation.url
  //   if (citation.description) {
  //     summary += `\n\n${citation.description}`
  //   }
  //   if (citation.image) {
  //     summary += `\n\n![${citation.title || 'Citation image'}](${citation.image})`
  //   }

  //   // markdown +=
  //   //   dedent`
  //   //   <details id="${citationNumber}">
  //   //     <summary>${citation.title ? `**${citation.title}**` : citation.url}${citation.description ? `\n\n${citation.description}` : ''}</summary>
  //   //     ${citation.error ? `Error: ${citation.error}` : citation.markdown || 'No content available'}
  //   //   </details>
  //   // ` + '\n\n'
  // })

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
    // scrapedCitations,
  }
}

export const research = createUnifiedFunction<Promise<ResearchResult>>(
  (query: string, options: Record<string, any>) => {
    return researchCore(query, options.apiKey, options.baseURL);
  }
);
