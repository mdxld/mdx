import * as monaco from 'monaco-editor';

export interface BrowserConfig {
  content: string;
  language: string;
  theme: string;
  mode?: 'browse' | 'edit' | 'preview';
}

export function createBrowserViewer(container: HTMLElement, config: BrowserConfig): monaco.editor.IStandaloneCodeEditor {
  const processedContent = processContentWithLinks(config.content);
  
  const editor = monaco.editor.create(container, {
    value: processedContent,
    language: config.language,
    theme: 'github-dark',
    lineNumbers: 'off',
    wordWrap: 'on',
    readOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
  });

  setupLinkNavigation(container);
  
  return editor;
}

function processContentWithLinks(content: string): string {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  let processedContent = content.replace(markdownLinkRegex, (match, text, url) => {
    return `${text} (${url})`;
  });
  
  processedContent = processedContent.replace(urlRegex, (url) => {
    return `${url} [Click to open]`;
  });
  
  return processedContent;
}

function setupLinkNavigation(container: HTMLElement): void {
  container.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const text = target.textContent || '';
    
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch && urlMatch[1]) {
      const url = urlMatch[1];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  });
}

export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    'md': 'markdown',
    'mdx': 'mdx',
    'mdxld': 'mdx',
    'txt': 'plaintext',
    'js': 'javascript',
    'ts': 'typescript',
    'json': 'json'
  };
  
  return languageMap[extension] || 'plaintext';
}

export function setupBrowserEnvironment(): void {
  (window as typeof window & { MonacoEnvironment?: { getWorkerUrl: (moduleId: string, label: string) => string } }).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      if (label === 'json') {
        return './monaco-editor/esm/vs/language/json/json.worker.js';
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return './monaco-editor/esm/vs/language/css/css.worker.js';
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return './monaco-editor/esm/vs/language/html/html.worker.js';
      }
      if (label === 'typescript' || label === 'javascript') {
        return './monaco-editor/esm/vs/language/typescript/ts.worker.js';
      }
      return './monaco-editor/esm/vs/editor/editor.worker.js';
    }
  };
}
