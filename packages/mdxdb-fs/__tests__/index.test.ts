import { describe, it, expect } from 'vitest'
import { MdxDb } from '../lib/mdxdb.js'

describe('mdxdb-fs package', () => {
  it('should be importable', () => {
    const db = new MdxDb()
    expect(db).toBeDefined()
    expect(db).toBeInstanceOf(MdxDb)
  })
})
