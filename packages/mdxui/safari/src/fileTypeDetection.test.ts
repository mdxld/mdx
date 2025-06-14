import { describe, it, expect } from 'vitest'
import {
  detectFileType,
  detectFileTypeFromUrl,
  detectFileTypeFromMimeType,
  detectFileTypeFromExtension,
  shouldRenderWithMonaco,
  getFileExtension
} from '../utils/fileTypeDetection.js'

describe('fileTypeDetection', () => {
  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('test.txt')).toBe('.txt')
      expect(getFileExtension('document.md')).toBe('.md')
      expect(getFileExtension('component.mdx')).toBe('.mdx')
      expect(getFileExtension('data.mdxld')).toBe('.mdxld')
      expect(getFileExtension('noextension')).toBe('')
    })
  })

  describe('detectFileTypeFromMimeType', () => {
    it('should detect text files', () => {
      expect(detectFileTypeFromMimeType('text/plain')).toBe('text')
      expect(detectFileTypeFromMimeType('text/txt')).toBe('text')
    })

    it('should detect markdown files', () => {
      expect(detectFileTypeFromMimeType('text/markdown')).toBe('markdown')
      expect(detectFileTypeFromMimeType('text/x-markdown')).toBe('markdown')
    })

    it('should detect mdx files', () => {
      expect(detectFileTypeFromMimeType('text/mdx')).toBe('mdx')
      expect(detectFileTypeFromMimeType('application/mdx')).toBe('mdx')
    })

    it('should detect mdxld files', () => {
      expect(detectFileTypeFromMimeType('text/mdxld')).toBe('mdxld')
      expect(detectFileTypeFromMimeType('application/mdxld')).toBe('mdxld')
    })

    it('should return unknown for unsupported types', () => {
      expect(detectFileTypeFromMimeType('image/png')).toBe('unknown')
      expect(detectFileTypeFromMimeType('application/json')).toBe('unknown')
    })
  })

  describe('detectFileTypeFromExtension', () => {
    it('should detect text files', () => {
      expect(detectFileTypeFromExtension('.txt')).toBe('text')
      expect(detectFileTypeFromExtension('.text')).toBe('text')
    })

    it('should detect markdown files', () => {
      expect(detectFileTypeFromExtension('.md')).toBe('markdown')
      expect(detectFileTypeFromExtension('.markdown')).toBe('markdown')
    })

    it('should detect mdx files', () => {
      expect(detectFileTypeFromExtension('.mdx')).toBe('mdx')
    })

    it('should detect mdxld files', () => {
      expect(detectFileTypeFromExtension('.mdxld')).toBe('mdxld')
    })

    it('should return unknown for unsupported extensions', () => {
      expect(detectFileTypeFromExtension('.js')).toBe('unknown')
      expect(detectFileTypeFromExtension('.png')).toBe('unknown')
    })
  })

  describe('detectFileType', () => {
    it('should prioritize mime type over extension', () => {
      const result = detectFileType('test.js', 'text/markdown')
      expect(result.fileType).toBe('markdown')
      expect(result.isSupported).toBe(true)
    })

    it('should fall back to extension when mime type is unknown', () => {
      const result = detectFileType('test.md', 'application/octet-stream')
      expect(result.fileType).toBe('markdown')
      expect(result.isSupported).toBe(true)
    })

    it('should return unknown when both mime type and extension are unsupported', () => {
      const result = detectFileType('test.js', 'application/javascript')
      expect(result.fileType).toBe('unknown')
      expect(result.isSupported).toBe(false)
    })
  })

  describe('detectFileTypeFromUrl', () => {
    it('should detect file type from URL path', () => {
      expect(detectFileTypeFromUrl('https://example.com/document.md').fileType).toBe('markdown')
      expect(detectFileTypeFromUrl('file:///Users/test/component.mdx').fileType).toBe('mdx')
      expect(detectFileTypeFromUrl('https://raw.githubusercontent.com/user/repo/main/README.md').fileType).toBe('markdown')
    })

    it('should handle URLs without extensions', () => {
      const result = detectFileTypeFromUrl('https://example.com/document')
      expect(result.fileType).toBe('unknown')
      expect(result.isSupported).toBe(false)
    })

    it('should handle invalid URLs', () => {
      const result = detectFileTypeFromUrl('not-a-url')
      expect(result.fileType).toBe('unknown')
      expect(result.isSupported).toBe(false)
    })
  })

  describe('shouldRenderWithMonaco', () => {
    it('should return true for supported file types', () => {
      expect(shouldRenderWithMonaco({ isSupported: true, fileType: 'text' })).toBe(true)
      expect(shouldRenderWithMonaco({ isSupported: true, fileType: 'markdown' })).toBe(true)
      expect(shouldRenderWithMonaco({ isSupported: true, fileType: 'mdx' })).toBe(true)
      expect(shouldRenderWithMonaco({ isSupported: true, fileType: 'mdxld' })).toBe(true)
    })

    it('should return false for unsupported file types', () => {
      expect(shouldRenderWithMonaco({ isSupported: false, fileType: 'unknown' })).toBe(false)
    })
  })
})
