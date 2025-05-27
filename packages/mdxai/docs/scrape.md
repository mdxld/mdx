# Scrape Function

The `scrape` function provides web scraping capabilities with intelligent caching, extracted from the research functionality to be reusable across the codebase.

## Features

- **Web Scraping**: Uses Firecrawl to extract content from web pages
- **Intelligent Caching**: Caches scraped content in `.ai/cache/[domain]/[...path]` structure
- **Cache TTL**: 24-hour cache expiration for fresh content
- **Error Handling**: Graceful error handling with error caching
- **Batch Processing**: Support for scraping multiple URLs
- **Progress Tracking**: Optional progress callbacks for batch operations

## Usage

### Single URL Scraping

```typescript
import { scrape } from './functions/scrape.js'

const result = await scrape('https://example.com/article')

console.log(result.title)       // Page title
console.log(result.description) // Meta description
console.log(result.markdown)    // Markdown content
console.log(result.cached)      // Whether result came from cache
```

### Multiple URL Scraping

```typescript
import { scrapeMultiple } from './functions/scrape.js'

const urls = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3'
]

const results = await scrapeMultiple(urls, (index, url, result) => {
  console.log(`Progress: ${index + 1}/${urls.length} - ${url}`)
})
```

## Return Type

```typescript
interface ScrapedContent {
  url: string
  title?: string
  description?: string
  image?: string
  markdown?: string
  html?: string
  error?: string
  cached?: boolean
  cachedAt?: string
}
```

## Cache Structure

The cache is organized in a hierarchical structure under `.ai/cache/`:

```
.ai/cache/
├── example.com/
│   ├── index.json              # https://example.com/
│   ├── about.json              # https://example.com/about
│   └── blog/
│       ├── post-1.json         # https://example.com/blog/post-1
│       └── post-2.json         # https://example.com/blog/post-2
├── github.com/
│   └── user/
│       └── repo.json           # https://github.com/user/repo
└── invalid/
    └── malformed_url.json      # Fallback for invalid URLs
```

## Cache Behavior

- **Fresh Content**: First scrape fetches from web and caches result
- **Cache Hit**: Subsequent scrapes within 24 hours return cached content
- **Cache Miss**: Content older than 24 hours triggers fresh scrape
- **Error Caching**: Errors are also cached to avoid repeated failed requests
- **Automatic Cleanup**: No automatic cleanup - cache grows over time

## Environment Variables

Requires `FIRECRAWL_API_KEY` environment variable to be set.

## Integration with Research

The `research` function now uses the `scrape` function internally, benefiting from the caching layer:

```typescript
import { research } from './functions/research.js'

const result = await research('latest developments in AI')
// Citations are automatically scraped and cached
```

## Error Handling

The function handles various error scenarios:

- **Network Errors**: Timeout, connection issues
- **Firecrawl Errors**: API errors, rate limits
- **Invalid URLs**: Malformed URLs are handled gracefully
- **File System Errors**: Cache write failures are logged but don't break scraping

## Performance Considerations

- **Cache Benefits**: Dramatically reduces API calls and improves response times
- **Storage**: Cache files are JSON, typically 1-50KB per page
- **Memory**: No in-memory caching, reads from disk each time
- **Concurrency**: Safe for concurrent access (file system handles locking)

## Testing

Run the test suite:

```bash
npm test -- scrape.test.ts
```

The tests cover:
- Basic scraping functionality
- Cache hit/miss scenarios
- Error handling
- Multiple URL processing
- Cache file path generation 