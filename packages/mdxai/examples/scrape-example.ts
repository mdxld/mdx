import { scrape, scrapeMultiple } from '../src/functions/scrape.js'

async function exampleUsage() {
  console.log('🔍 Scraping a single URL...')
  
  // First scrape - will fetch from web and cache
  const result1 = await scrape('https://example.com')
  console.log(`First scrape - Cached: ${result1.cached}`)
  console.log(`Title: ${result1.title}`)
  console.log(`Description: ${result1.description}`)
  
  // Second scrape - will load from cache
  const result2 = await scrape('https://example.com')
  console.log(`Second scrape - Cached: ${result2.cached}`)
  
  console.log('\n🔍 Scraping multiple URLs...')
  
  const urls = [
    'https://github.com',
    'https://stackoverflow.com',
    'https://developer.mozilla.org',
  ]
  
  const results = await scrapeMultiple(urls, (index, url, result) => {
    console.log(`Progress: ${index + 1}/${urls.length} - ${url} (cached: ${result.cached})`)
  })
  
  console.log(`\nScraped ${results.length} URLs`)
  console.log(`Cached results: ${results.filter(r => r.cached).length}`)
  console.log(`Fresh results: ${results.filter(r => !r.cached).length}`)
  console.log(`Errors: ${results.filter(r => r.error).length}`)
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch(console.error)
}

export { exampleUsage } 