import { isSupportedFile, getFileExtension } from './fileDetection.js';
import { createMonacoEditor, getLanguageFromExtension, setupMonacoEnvironment } from './monacoRenderer.js';

async function initializeMonacoViewer(): Promise<void> {
  const currentUrl = window.location.href;
  const mimeType = document.contentType;
  
  if (!isSupportedFile(currentUrl, mimeType)) {
    return;
  }

  const content = document.body.textContent || document.body.innerText || '';
  
  if (!content.trim()) {
    return;
  }

  setupMonacoEnvironment();
  
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
  
  const container = document.createElement('div');
  container.id = 'monaco-container';
  container.style.width = '100%';
  container.style.height = '100vh';
  document.body.appendChild(container);
  
  const extension = getFileExtension(currentUrl);
  const language = getLanguageFromExtension(extension);
  
  try {
    const editor = createMonacoEditor(container, {
      content,
      language,
      theme: 'github-dark'
    });
    
    window.addEventListener('resize', () => {
      editor.layout();
    });
    
    console.log('Monaco editor initialized for file:', currentUrl);
  } catch (error) {
    console.error('Failed to initialize Monaco editor:', error);
    document.body.innerHTML = `<pre style="padding: 20px; font-family: monospace; white-space: pre-wrap;">${content}</pre>`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMonacoViewer);
} else {
  initializeMonacoViewer();
}
