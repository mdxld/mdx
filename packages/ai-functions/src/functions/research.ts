import { generateText } from 'ai'
import { createAIModel } from '../ai.js'
import dedent from 'dedent'
import { scrape, ScrapedContent } from './scrape.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

export type ResearchResult = {
  text: string
  markdown: string
  citations: string[]
  reasoning: string
}

export type ResearchTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<ResearchResult>

async function researchCore(query: string, apiKey?: string, baseURL?: string): Promise<ResearchResult> {
  const aiModel = createAIModel(apiKey, baseURL)
  const result = await generateText({
    model: aiModel('perplexity/sonar-deep-research'),
    prompt: `Research ${query}`,
  })

  const body = result?.response?.body as any || {}
  const citations = body.citations || []
  const reasoning = body.choices?.[0]?.message?.reasoning || ''

  console.log(body.choices?.[0]?.message)

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
  }
}

export const research = createUnifiedFunction<Promise<ResearchResult>>(
  (query: string, options: Record<string, any>) => {
    return researchCore(query, options.apiKey, options.baseURL);
  }
);
