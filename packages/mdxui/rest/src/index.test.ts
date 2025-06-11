import { describe, it, expect } from 'vitest'
import { 
  createApiResponse, 
  generateResourceLinks, 
  generatePaginationLinks,
  responseToJsonLd,
  defaultApiContext 
} from './index.js'

describe('@mdxui/rest', () => {
  it('should create a complete API response', () => {
    const response = createApiResponse(
      { message: 'test data' },
      { name: 'Test API', version: '1.0.0', baseUrl: 'https://api.test.com' },
      { authenticated: true, username: 'testuser', usage: { requests: 1 } }
    )
    
    expect(response.api.name).toBe('Test API')
    expect(response.api.version).toBe('1.0.0')
    expect(response.data.message).toBe('test data')
    expect(response.user.auth.authenticated).toBe(true)
    expect(response.user.auth.user).toBe('testuser')
  })
  
  it('should generate resource links', () => {
    const links = generateResourceLinks('posts', '123', 'https://api.test.com')
    
    expect(links.self).toBe('https://api.test.com/posts/123')
    expect(links.collection).toBe('https://api.test.com/posts')
  })
  
  it('should generate pagination links', () => {
    const links = generatePaginationLinks('posts', 'https://api.test.com', 2, 5)
    
    expect(links.self).toBe('https://api.test.com/posts?page=2')
    expect(links.first).toBe('https://api.test.com/posts?page=1')
    expect(links.last).toBe('https://api.test.com/posts?page=5')
    expect(links.prev).toBe('https://api.test.com/posts?page=1')
    expect(links.next).toBe('https://api.test.com/posts?page=3')
  })
  
  it('should convert response to JSON-LD', () => {
    const response = { api: { name: 'Test' }, data: {}, links: {}, user: {} }
    const jsonLd = responseToJsonLd(response)
    
    expect(jsonLd['@context']).toBeDefined()
    expect(jsonLd['@graph']).toBeDefined()
  })
})
