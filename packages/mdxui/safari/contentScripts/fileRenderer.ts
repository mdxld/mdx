import type * as MonacoType from 'monaco-editor'
import { 
  detectFileTypeFromUrl, 
  shouldRenderWithMonaco, 
  FileTypeInfo,
  fetchFileContent,
  addLoadingIndicator, 
  removeLoadingIndicator 
} from '@mdxui/browser'
import { 
  renderFileWithBrowserViewer 
} from './monacoIntegration.js'

declare const monaco: typeof MonacoType

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
    
    const { KeyMod, KeyCode } = monaco
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
