import { generateText } from 'ai'
import { model } from '../ai'
import dedent from 'dedent'
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js'
import { QueueManager } from '../ui/index.js'

interface ScrapedCitation {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  markdown?: string;
  html?: string;
  error?: string;
}

export const research = async (query: string) => {
  const result = await generateText({
    model: model('perplexity/sonar-deep-research'),
    prompt: `research ${query}`,
  })

  const body = result.response.body as any
  const citations = body.citations
  const reasoning = body.choices[0]?.message.reasoning

  const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  
  const queue = new QueueManager(5); // Process 5 citations at a time
  
  const scrapedCitations: ScrapedCitation[] = await Promise.all(
    citations.map(async (url: string, index: number) => {
      try {
        const scrapeResult = await queue.addTask(
          `Scraping citation ${index + 1}: ${url}`,
          async () => {
            try {
              const response = await app.scrapeUrl(url, { formats: ['markdown', 'html'] }) as any;
              
              if (!response.success) {
                throw new Error(`Failed to scrape: ${response.error || 'Unknown error'}`);
              }
              
              return {
                url,
                title: response.data?.metadata?.title || response.data?.metadata?.ogTitle || '',
                description: response.data?.metadata?.description || response.data?.metadata?.ogDescription || '',
                image: response.data?.metadata?.ogImage || '',
                markdown: response.data?.markdown || '',
                html: response.data?.html || '',
              };
            } catch (error) {
              console.error(`Error scraping ${url}:`, error);
              return { url, error: error instanceof Error ? error.message : String(error) };
            }
          }
        );
        
        return scrapeResult;
      } catch (error) {
        console.error(`Error processing citation ${index + 1}:`, error);
        return { url, error: error instanceof Error ? error.message : String(error) };
      }
    })
  );
  
  let text = result?.text || '';
  
  for (let i = 0; i < citations.length; i++) {
    const citationNumber = i + 1;
    const citationRegex = new RegExp(`\\[${citationNumber}\\]`, 'g');
    text = text.replace(citationRegex, `<sup><a href="#citation-${citationNumber}">${citationNumber}</a></sup>`);
  }
  
  let markdown = text + '\n\n';
  
  scrapedCitations.forEach((citation, index) => {
    const citationNumber = index + 1;
    
    let summary = citation.title ? `**${citation.title}**` : citation.url;
    if (citation.description) {
      summary += `\n\n${citation.description}`;
    }
    if (citation.image) {
      summary += `\n\n![${citation.title || 'Citation image'}](${citation.image})`;
    }
    
    markdown += dedent`
      <details id="citation-${citationNumber}">
        <summary>${summary}</summary>
        ${citation.error ? `Error: ${citation.error}` : citation.markdown || 'No content available'}
      </details>
    ` + '\n\n';
  });
  
  if (reasoning) {
    markdown += dedent`
      <details>
        <summary>Reasoning</summary>
        ${reasoning}
      </details>
    `;
  }

  return {
    text: result?.text || '',
    markdown,
    citations,
    reasoning,
    scrapedCitations,
  }
}
