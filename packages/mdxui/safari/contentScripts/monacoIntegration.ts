import type * as MonacoType from 'monaco-editor'
import { 
  MonacoConfig,
  DEFAULT_MONACO_CONFIG,
  getLanguageFromFileType,
  createMonacoEditor,
  createMonacoContainer,
  replacePageWithMonaco,
  setupMonacoThemes,
  renderFileWithMonaco,
  FileTypeInfo
} from '@mdxui/browser'

declare global {
  interface Window {
    require: {
      config: (config: { paths: Record<string, string> }) => void
      (modules: string[], callback: () => void): void
    }
  }
}

interface Chrome {
  runtime: {
    getURL: (path: string) => string
  }
}

declare const chrome: Chrome

declare const monaco: typeof MonacoType

export type { MonacoConfig } from '@mdxui/browser'
export { DEFAULT_MONACO_CONFIG, getLanguageFromFileType }

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
      
      (window as unknown as WindowWithRequire).require.config({
        paths: {
          vs: chrome.runtime.getURL('node_modules/monaco-editor/min/vs')
        }
      });
      
      (window as unknown as WindowWithRequire).require(['vs/editor/editor.main'], () => {
        resolve()
      })
    }
    document.head.appendChild(script)
  })
}

export function createBrowserViewer(
  container: HTMLElement,
  content: string,
  fileType: FileTypeInfo['fileType'],
  config: Partial<MonacoConfig> = {}
): monaco.editor.IStandaloneCodeEditor {
  return createMonacoEditor(container, content, fileType, config)
}

export function createBrowserContainer(): HTMLElement {
  const container = createMonacoContainer()
  container.id = 'mdx-browser-viewer'
  return container
}

export function replacePageWithBrowserViewer(
  content: string,
  fileType: FileTypeInfo['fileType'],
  config?: Partial<MonacoConfig>
): monaco.editor.IStandaloneCodeEditor {
  return replacePageWithMonaco(content, fileType, config)
}

export { setupMonacoThemes }

export async function renderFileWithBrowserViewer(
  content: string,
  fileInfo: FileTypeInfo
): Promise<monaco.editor.IStandaloneCodeEditor> {
  await initializeMonaco()
  return renderFileWithMonaco(content, fileInfo)
}
