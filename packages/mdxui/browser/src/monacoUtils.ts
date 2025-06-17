import * as monaco from 'monaco-editor'
import type { FileTypeInfo } from './fileDetection.js'

export interface MonacoConfig {
  theme: string
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  lineNumbers: 'on' | 'off' | 'relative' | 'interval'
  readOnly: boolean
  automaticLayout: boolean
  minimap: {
    enabled: boolean
  }
}

export const DEFAULT_MONACO_CONFIG: MonacoConfig = {
  theme: 'vs-dark',
  wordWrap: 'on',
  lineNumbers: 'off',
  readOnly: false,
  automaticLayout: true,
  minimap: {
    enabled: false
  }
}

export function getLanguageFromFileType(fileType: FileTypeInfo['fileType']): string {
  switch (fileType) {
    case 'markdown':
      return 'markdown'
    case 'mdx':
      return 'markdown'
    case 'mdxld':
      return 'markdown'
    case 'text':
      return 'plaintext'
    default:
      return 'plaintext'
  }
}

export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    'md': 'markdown',
    'mdx': 'markdown',
    'mdxld': 'markdown',
    'txt': 'plaintext',
    'js': 'javascript',
    'ts': 'typescript',
    'json': 'json'
  }
  
  return languageMap[extension] || 'plaintext'
}

export async function initializeMonaco(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof monaco !== 'undefined') {
      resolve()
      return
    }

    resolve()
  })
}

export function createMonacoEditor(
  container: HTMLElement,
  options: {
    content: string
    language: string
    theme?: string
    readOnly?: boolean
  }
): monaco.editor.IStandaloneCodeEditor
export function createMonacoEditor(
  container: HTMLElement,
  content: string,
  fileType: FileTypeInfo['fileType'],
  config?: Partial<MonacoConfig>
): monaco.editor.IStandaloneCodeEditor
export function createMonacoEditor(
  container: HTMLElement,
  contentOrOptions: string | {
    content: string
    language: string
    theme?: string
    readOnly?: boolean
  },
  fileType?: FileTypeInfo['fileType'],
  config: Partial<MonacoConfig> = {}
): monaco.editor.IStandaloneCodeEditor {
  let content: string
  let language: string
  let theme: string
  let readOnly: boolean

  if (typeof contentOrOptions === 'string') {
    content = contentOrOptions
    language = getLanguageFromFileType(fileType!)
    const finalConfig = { ...DEFAULT_MONACO_CONFIG, ...config }
    theme = finalConfig.theme
    readOnly = finalConfig.readOnly
  } else {
    content = contentOrOptions.content
    language = contentOrOptions.language
    theme = contentOrOptions.theme || 'github-dark'
    readOnly = contentOrOptions.readOnly || false
  }

  const processedContent = processContentWithLinks(content)

  const editor = monaco.editor.create(container, {
    value: processedContent,
    language: language,
    theme: theme,
    wordWrap: 'on',
    lineNumbers: 'off',
    readOnly: readOnly,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderWhitespace: 'none',
    renderControlCharacters: false,
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    lineHeight: 1.5,
    padding: {
      top: 16,
      bottom: 16
    }
  })

  setupLinkNavigation(container)
  return editor
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

export function setupMonacoThemes(): void {
  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'e1e4e8', background: '0d1117' },
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'regexp', foreground: '7ee787' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'class', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'ffa657' },
      { token: 'constant', foreground: '79c0ff' },
      { token: 'property', foreground: '79c0ff' },
      { token: 'attribute', foreground: '7ee787' },
      { token: 'tag', foreground: '7ee787' },
      { token: 'delimiter', foreground: 'e1e4e8' }
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#e1e4e8',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
      'editorCursor.foreground': '#e1e4e8',
      'editorWhitespace.foreground': '#484f58',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#e1e4e8'
    }
  })
}

export function setupMonacoEnvironment(): void {
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

export function createMonacoContainer(): HTMLElement {
  const container = document.createElement('div')
  container.id = 'mdx-monaco-editor'
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10000;
    background: #1e1e1e;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
  `
  return container
}

export function replacePageWithMonaco(
  content: string,
  fileType: FileTypeInfo['fileType'],
  config?: Partial<MonacoConfig>
): monaco.editor.IStandaloneCodeEditor {
  document.body.innerHTML = ''
  document.body.style.cssText = `
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #1e1e1e;
  `

  const container = createMonacoContainer()
  document.body.appendChild(container)

  const editor = createMonacoEditor(container, content, fileType, config)

  window.addEventListener('resize', () => {
    editor.layout()
  })

  return editor
}

export async function renderFileWithMonaco(
  content: string,
  fileInfo: FileTypeInfo
): Promise<monaco.editor.IStandaloneCodeEditor> {
  await initializeMonaco()
  setupMonacoThemes()
  
  const config: Partial<MonacoConfig> = {
    theme: 'github-dark',
    wordWrap: 'on',
    lineNumbers: 'off'
  }
  
  return replacePageWithMonaco(content, fileInfo.fileType, config)
}
