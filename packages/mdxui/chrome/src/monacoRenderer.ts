import * as monaco from 'monaco-editor';

export interface MonacoConfig {
  content: string;
  language: string;
  theme: string;
}

export function createMonacoEditor(container: HTMLElement, config: MonacoConfig): monaco.editor.IStandaloneCodeEditor {
  return monaco.editor.create(container, {
    value: config.content,
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
  };
  
  return languageMap[extension] || 'plaintext';
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
