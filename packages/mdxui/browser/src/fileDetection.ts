export interface FileTypeInfo {
  isSupported: boolean
  fileType: 'text' | 'markdown' | 'mdx' | 'mdxld' | 'unknown'
  mimeType?: string
  extension?: string
}

export const SUPPORTED_MIME_TYPES = {
  TEXT: ['text/plain', 'text/txt'],
  MARKDOWN: ['text/markdown', 'text/x-markdown'],
  MDX: ['text/mdx', 'application/mdx'],
  MDXLD: ['text/mdxld', 'application/mdxld']
} as const

export const SUPPORTED_EXTENSIONS = {
  TEXT: ['.txt', '.text'],
  MARKDOWN: ['.md', '.markdown'],
  MDX: ['.mdx'],
  MDXLD: ['.mdxld']
} as const

export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex).toLowerCase() : ''
}

export function detectFileTypeFromMimeType(mimeType: string): FileTypeInfo['fileType'] {
  const normalizedMimeType = mimeType.toLowerCase()
  
  if ((SUPPORTED_MIME_TYPES.MDXLD as readonly string[]).includes(normalizedMimeType)) {
    return 'mdxld'
  }
  if ((SUPPORTED_MIME_TYPES.MDX as readonly string[]).includes(normalizedMimeType)) {
    return 'mdx'
  }
  if ((SUPPORTED_MIME_TYPES.MARKDOWN as readonly string[]).includes(normalizedMimeType)) {
    return 'markdown'
  }
  if ((SUPPORTED_MIME_TYPES.TEXT as readonly string[]).includes(normalizedMimeType)) {
    return 'text'
  }
  
  return 'unknown'
}

export function detectFileTypeFromExtension(extension: string): FileTypeInfo['fileType'] {
  const normalizedExtension = extension.toLowerCase()
  
  if ((SUPPORTED_EXTENSIONS.MDXLD as readonly string[]).includes(normalizedExtension)) {
    return 'mdxld'
  }
  if ((SUPPORTED_EXTENSIONS.MDX as readonly string[]).includes(normalizedExtension)) {
    return 'mdx'
  }
  if ((SUPPORTED_EXTENSIONS.MARKDOWN as readonly string[]).includes(normalizedExtension)) {
    return 'markdown'
  }
  if ((SUPPORTED_EXTENSIONS.TEXT as readonly string[]).includes(normalizedExtension)) {
    return 'text'
  }
  
  return 'unknown'
}

export function detectFileType(filename: string, mimeType?: string): FileTypeInfo {
  const extension = getFileExtension(filename)
  
  let fileType: FileTypeInfo['fileType'] = 'unknown'
  
  if (mimeType) {
    fileType = detectFileTypeFromMimeType(mimeType)
  }
  
  if (fileType === 'unknown' && extension) {
    fileType = detectFileTypeFromExtension(extension)
  }
  
  const isSupported = fileType !== 'unknown'
  
  return {
    isSupported,
    fileType,
    mimeType,
    extension
  }
}

export function isTextFile(blob: Blob): boolean {
  return blob.type.startsWith('text/') || 
         (SUPPORTED_MIME_TYPES.TEXT as readonly string[]).includes(blob.type) ||
         (SUPPORTED_MIME_TYPES.MARKDOWN as readonly string[]).includes(blob.type) ||
         (SUPPORTED_MIME_TYPES.MDX as readonly string[]).includes(blob.type) ||
         (SUPPORTED_MIME_TYPES.MDXLD as readonly string[]).includes(blob.type)
}

export function detectFileTypeFromUrl(url: string): FileTypeInfo {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || ''
    
    return detectFileType(filename)
  } catch {
    return {
      isSupported: false,
      fileType: 'unknown'
    }
  }
}

export function shouldRenderWithMonaco(fileInfo: FileTypeInfo): boolean {
  return fileInfo.isSupported && fileInfo.fileType !== 'unknown'
}

export function isSupportedFile(url: string, mimeType?: string): boolean {
  const fileInfo = detectFileTypeFromUrl(url)
  if (fileInfo.isSupported) return true
  
  if (mimeType) {
    const typeFromMime = detectFileTypeFromMimeType(mimeType)
    return typeFromMime !== 'unknown'
  }
  
  return false
}
