import { isSupportedFile, getFileExtension } from './fileDetection.js';
import { createBrowserViewer, getLanguageFromExtension, setupBrowserEnvironment } from './monacoRenderer.js';

async function initializeBrowserViewer(): Promise<void> {
  const currentUrl = window.location.href;
  const mimeType = document.contentType;
  
  if (!isSupportedFile(currentUrl, mimeType)) {
    return;
  }

  const content = document.body.textContent || document.body.innerText || '';
  
  if (!content.trim()) {
    return;
  }

  setupBrowserEnvironment();
  
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
  
  const container = document.createElement('div');
  container.id = 'browser-container';
  container.style.width = '100%';
  container.style.height = '100vh';
  document.body.appendChild(container);
  
  const extension = getFileExtension(currentUrl);
  const language = getLanguageFromExtension(extension);
  
  try {
    const editor = createBrowserViewer(container, {
      content,
      language,
      theme: 'github-dark',
      mode: 'browse'
    });
    
    window.addEventListener('resize', () => {
      editor.layout();
    });
    
    console.log('Browser viewer initialized for file:', currentUrl);
  } catch (error) {
    console.error('Failed to initialize browser viewer:', error);
    document.body.innerHTML = `<pre style="padding: 20px; font-family: monospace; white-space: pre-wrap;">${content}</pre>`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBrowserViewer);
} else {
  initializeBrowserViewer();
}
