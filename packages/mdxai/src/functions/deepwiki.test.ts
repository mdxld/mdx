import { describe, expect, it } from 'vitest'
import { deepwiki } from './deepwiki'

describe('deepwiki', () => {
  it('should read the wiki structure', async () => {
    const result = await deepwiki.readWikiStructure({ repoName: 'vercel/ai' })
    console.log(result.content)
    expect(result.content).toBeDefined()
  })
  it('should read the wiki contents', async () => {
    const result = await deepwiki.readWikiContents({ repoName: 'vercel/ai' })
    console.log(result.content)
    expect(result.content).toBeDefined()
  })
  it.skip('should be able to ask a question', async () => {
    const result = await deepwiki.askQuestion({ repoName: 'vercel/ai', question: 'How do structured outputs work?' })
    console.log(result.content)
    expect(result.content).toBeDefined()
    expect((result.content as any)[0].content).toContain('structured outputs')
  })
})
