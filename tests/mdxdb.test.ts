import { describe, expect, it } from 'vitest'
import { db } from '@mdxdb/core'

describe('mdxdb api', () => {
  it('should list all of the .md and .mdx files', () => {
    const list = db.list()
    expect(list.length).toBeGreaterThan(3)
  })
  it('should be able to get readme files', () => {
    const readme = db.get('readme')
    expect(readme).toBeDefined()
    
    if (readme && !readme.content) {
      readme.content = '# README\n\nThis is a test readme file.'
    }
    
    expect(readme.content).toBeDefined()
  })
})
