import { detectFileTypeFromUrl, shouldRenderWithMonaco, FileTypeInfo } from '../utils/fileTypeDetection.js'
import { renderFileWithBrowserViewer } from './monacoIntegration.js'

interface PageInfo {
  url: string
  contentType?: string
  isTextFile: boolean
  fileInfo: FileTypeInfo
}

function getPageInfo(): PageInfo {
  const url = window.location.href
  const contentType = document.contentType || ''
  const fileInfo = detectFileTypeFromUrl(url)
  
  const isTextFile = contentType.startsWith('text/') || 
                     fileInfo.isSupported ||
                     isPlainTextPage()
  
  return {
    url,
    contentType,
    isTextFile,
    fileInfo
  }
}

function isPlainTextPage(): boolean {
  const body = document.body
  if (!body) return false
  
  const children = Array.from(body.children)
  if (children.length === 1 && children[0]?.tagName === 'PRE') {
    return true
  }
  
  const bodyText = body.textContent || ''
  const bodyHtml = body.innerHTML || ''
  
  const textRatio = bodyText.length / bodyHtml.length
  return textRatio > 0.8 && bodyText.length > 50
}

function extractPageContent(): string {
  const body = document.body
  if (!body) return ''
  
  const preElements = body.querySelectorAll('pre')
  if (preElements.length === 1 && body.children.length === 1) {
    return preElements[0]?.textContent || ''
  }
  
  return body.textContent || ''
}

async function fetchFileContent(url: string): Promise<string> {
  try {
    if (url.startsWith('file://')) {
      return extractPageContent()
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.text()
  } catch (error) {
    console.warn('Failed to fetch file content, using DOM content:', error)
    return extractPageContent()
  }
}

function shouldProcessPage(pageInfo: PageInfo): boolean {
  if (!pageInfo.isTextFile) {
    return false
  }
  
  if (!shouldRenderWithMonaco(pageInfo.fileInfo)) {
    return false
  }
  
  if (document.getElementById('mdx-browser-viewer')) {
    return false
  }
  
  const url = pageInfo.url
  if (!url.startsWith('file://') && !isDirectFileUrl(url)) {
    return false
  }
  
  return true
}

function isDirectFileUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    const supportedExtensions = ['.txt', '.md', '.markdown', '.mdx', '.mdxld']
    return supportedExtensions.some(ext => pathname.toLowerCase().endsWith(ext))
  } catch {
    return false
  }
}

function addLoadingIndicator(): HTMLElement {
  const loading = document.createElement('div')
  loading.id = 'mdx-loading'
  loading.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0d1117;
    color: #e1e4e8;
    padding: 20px;
    border-radius: 8px;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `
  loading.textContent = 'Loading Browser Viewer...'
  
  document.body.appendChild(loading)
  return loading
}

function removeLoadingIndicator(): void {
  const loading = document.getElementById('mdx-loading')
  if (loading) {
    loading.remove()
  }
}

async function processPage(): Promise<void> {
  const pageInfo = getPageInfo()
  
  console.log('MDX Safari Extension: Page info:', pageInfo)
  
  if (!shouldProcessPage(pageInfo)) {
    console.log('MDX Safari Extension: Page should not be processed')
    return
  }
  
  console.log('MDX Safari Extension: Processing page with Browser Viewer')
  
  try {
    addLoadingIndicator()
    
    const content = await fetchFileContent(pageInfo.url)
    
    if (!content.trim()) {
      console.warn('MDX Safari Extension: No content found')
      removeLoadingIndicator()
      return
    }
    
    removeLoadingIndicator()
    
    const editor = await renderFileWithBrowserViewer(content, pageInfo.fileInfo)
    
    console.log('MDX Safari Extension: Browser viewer initialized successfully')
    
    const { KeyMod, KeyCode } = await import('monaco-editor')
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => {
      console.log('Save shortcut pressed')
    })
    
  } catch (error) {
    console.error('MDX Safari Extension: Error processing page:', error)
    removeLoadingIndicator()
    
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f85149;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
      font-size: 12px;
      z-index: 10001;
      max-width: 300px;
    `
    const errorMessage = error instanceof Error ? error.message : String(error)
    errorDiv.textContent = `Failed to load Browser Viewer: ${errorMessage}`
    document.body.appendChild(errorDiv)
    
    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processPage)
} else {
  processPage()
}

let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(processPage, 100) // Small delay to let page settle
  }
}).observe(document, { subtree: true, childList: true })
