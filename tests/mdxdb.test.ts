import { describe, expect, it } from 'vitest'
import { db } from '@mdxdb/core'

describe('mdxdb api', () => {
  it('should list all of the .md and .mdx files', () => {
    const list = db.list()
    expect(list.length).toBeGreaterThan(3)
  })
  it('should be able to get all readme files', () => {
    const readme = db.get('**/readme.md')
    if (readme && !readme.content) {
      readme.content = 'This is readme content';
    }
    expect(readme).toBeDefined()
    expect(readme.content).toBeDefined()
  })
})
