import { generateText } from 'ai'
import { model } from '../ai'
import dedent from 'dedent'
import { QueueManager } from '../ui/index.js'
import { scrape, ScrapedContent } from './scrape.js'
import { parseTemplate } from '../utils/template.js'

/**
 * Research template literal function for external data gathering
 *
 * Usage: await research`${market} in the context of delivering ${idea}`
 */
export type ResearchTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>


const queue = new QueueManager(25) // Process 25 citations at a time

/**
 * Core research function that takes a query string and returns research results
 */
async function researchCore(query: string) {
  const result = await generateText({
    model: model('perplexity/sonar-deep-research'),
    prompt: `research ${query}`,
  })

  // Handle potential undefined response property
  const body = result?.response?.body as any || {}
  const citations = body.citations || []
  const reasoning = body.choices?.[0]?.message?.reasoning || ''


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

// Create a function that supports both string parameters and template literals
function researchFunction(queryOrTemplate: string | TemplateStringsArray, ...values: any[]): Promise<any> {
  // If first argument is a string, use the original interface
  if (typeof queryOrTemplate === 'string') {
    return researchCore(queryOrTemplate)
  }
  
  // If first argument is a TemplateStringsArray, use template literal interface
  if (Array.isArray(queryOrTemplate) && 'raw' in queryOrTemplate) {
    const query = parseTemplate(queryOrTemplate as TemplateStringsArray, values)
    return researchCore(query)
  }
  
  throw new Error('Research function must be called with a string or as a template literal')
}

export const research = new Proxy(researchFunction, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }

    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }

    return target
  },

  apply(target, thisArg, args: any[]) {
    const [first, ...rest] = args
    return target(first, ...rest)
  },
})
