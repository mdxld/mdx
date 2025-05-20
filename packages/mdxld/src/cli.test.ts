import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'

vi.mock('./parser', () => ({
  parseFrontmatter: vi.fn(),
  convertToJSONLD: vi.fn(),
}))

import { validate } from './cli'
import { parseFrontmatter, convertToJSONLD } from './parser'

let filePath: string

beforeEach(() => {
  filePath = path.join(tmpdir(), `mdxld-test-${Date.now()}.mdx`)
  fs.writeFileSync(filePath, 'content')
})

afterEach(() => {
  fs.unlinkSync(filePath)
  vi.clearAllMocks()
})

it('returns true when validation succeeds', () => {
  ;(parseFrontmatter as any).mockReturnValue({ frontmatter: { title: 't' } })
  ;(convertToJSONLD as any).mockReturnValue({})
  expect(validate(filePath)).toBe(true)
  expect(parseFrontmatter).toHaveBeenCalled()
  expect(convertToJSONLD).toHaveBeenCalled()
})

it('throws when parseFrontmatter returns an error', () => {
  ;(parseFrontmatter as any).mockReturnValue({ frontmatter: null, error: 'bad' })
  expect(() => validate(filePath)).toThrow('bad')
})

it('throws when convertToJSONLD fails', () => {
  ;(parseFrontmatter as any).mockReturnValue({ frontmatter: {} })
  ;(convertToJSONLD as any).mockImplementation(() => {
    throw new Error('oops')
  })
  expect(() => validate(filePath)).toThrow('oops')
})
