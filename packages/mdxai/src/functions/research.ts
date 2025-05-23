import { generateText } from 'ai'
import { model } from '../ai'
import dedent from 'dedent'

export const research = async (query: string) => {
  const result = await generateText({
    model: model('perplexity/sonar-deep-research'),
    prompt: `research ${query}`,
  })


  const body = result.response.body as any
  const citations = body.citations
  const reasoning = body.choices[0]?.message.reasoning

  let markdown = result?.text || '' + '\n'

  citations.map((citation: string, index: number) => {
    markdown += `\n${index + 1}. ${citation}`
  })

  if (reasoning) {
    markdown += '\n\n' + dedent`
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