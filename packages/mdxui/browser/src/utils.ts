export function extractPageContent(): string {
  const body = document.body
  if (!body) return ''
  
  const preElements = body.querySelectorAll('pre')
  if (preElements.length === 1 && body.children.length === 1) {
    return preElements[0]?.textContent || ''
  }
  
  return body.textContent || ''
}

export async function fetchFileContent(url: string): Promise<string> {
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

export function addLoadingIndicator(): HTMLElement {
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
  loading.textContent = 'Loading Monaco Editor...'
  
  document.body.appendChild(loading)
  return loading
}

export function removeLoadingIndicator(): void {
  const loading = document.getElementById('mdx-loading')
  if (loading) {
    loading.remove()
  }
}
