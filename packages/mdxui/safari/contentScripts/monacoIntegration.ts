import * as monaco from 'monaco-editor'
import { FileTypeInfo } from '../utils/fileTypeDetection.js'

declare global {
  interface Window {
    require: {
      config: (config: { paths: Record<string, string> }) => void
      (modules: string[], callback: () => void): void
    }
  }
  
  namespace chrome {
    namespace runtime {
      function getURL(path: string): string
    }
  }
}

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

export async function initializeMonaco(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof monaco !== 'undefined') {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = chrome.runtime.getURL('node_modules/monaco-editor/min/vs/loader.js')
    script.onload = () => {
      interface WindowWithRequire extends Window {
        require: {
          config: (config: { paths: Record<string, string> }) => void
          (modules: string[], callback: () => void): void
        }
      }
      
      (window as WindowWithRequire).require.config({
        paths: {
          vs: chrome.runtime.getURL('node_modules/monaco-editor/min/vs')
        }
      });
      
      (window as WindowWithRequire).require(['vs/editor/editor.main'], () => {
        resolve()
      })
    }
    document.head.appendChild(script)
  })
}

export function createMonacoEditor(
  container: HTMLElement,
  content: string,
  fileType: FileTypeInfo['fileType'],
  config: Partial<MonacoConfig> = {}
): monaco.editor.IStandaloneCodeEditor {
  const finalConfig = { ...DEFAULT_MONACO_CONFIG, ...config }
  const language = getLanguageFromFileType(fileType)

  const editor = monaco.editor.create(container, {
    value: content,
    language: language,
    theme: finalConfig.theme,
    wordWrap: finalConfig.wordWrap,
    lineNumbers: finalConfig.lineNumbers,
    readOnly: finalConfig.readOnly,
    automaticLayout: finalConfig.automaticLayout,
    minimap: finalConfig.minimap,
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

  return editor
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
