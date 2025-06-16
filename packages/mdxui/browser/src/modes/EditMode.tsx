import React, { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'

interface EditModeProps {
  content: string
  language: string
  theme: string
  onContentChange: (content: string) => void
  onSave: () => void
  readOnly: boolean
  isLoading: boolean
  error: string | null
}

export const EditMode: React.FC<EditModeProps> = ({
  content,
  language,
  theme,
  onContentChange,
  onSave,
  readOnly,
  isLoading,
  error,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    monaco.editor.getModels().forEach(model => model.dispose())

    const getMonacoLanguage = (lang: string) => {
      const langMap: Record<string, string> = {
        'markdown': 'markdown',
        'mdx': 'markdown',
        'javascript': 'javascript',
        'typescript': 'typescript',
        'json': 'json',
        'html': 'html',
        'css': 'css',
      }
      return langMap[lang] || 'plaintext'
    }

    const editor = monaco.editor.create(containerRef.current, {
      value: content,
      language: getMonacoLanguage(language),
      theme: theme === 'github-dark' ? 'vs-dark' : 'vs',
      readOnly,
      wordWrap: 'on',
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    })

    editorRef.current = editor

    const disposable = editor.onDidChangeModelContent(() => {
      const newContent = editor.getValue()
      onContentChange(newContent)
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave()
    })

    return () => {
      disposable.dispose()
      editor.dispose()
    }
  }, [language, theme, readOnly])

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== content) {
      editorRef.current.setValue(content)
    }
  }, [content])

  return (
    <div className="mdxui-edit-mode" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {error && (
        <div 
          className="mdxui-error-banner"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#f85149',
            color: 'white',
            padding: '8px 16px',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}
      {isLoading && (
        <div
          className="mdxui-loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            zIndex: 1001,
          }}
        >
          Saving...
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          marginTop: error ? '40px' : '0',
        }}
      />
    </div>
  )
}
