import React, { useEffect, useState } from 'react'
import { compile, evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'

interface PreviewModeProps {
  content: string
  theme: string
  error: string | null
}

export const PreviewMode: React.FC<PreviewModeProps> = ({
  content,
  theme,
  error,
}) => {
  const [RenderedComponent, setRenderedComponent] = useState<React.ComponentType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [compileError, setCompileError] = useState<string | null>(null)

  useEffect(() => {
    const compileAndRender = async () => {
      setIsLoading(true)
      setCompileError(null)

      try {
        const compiled = await compile(content, {
          outputFormat: 'function-body',
          development: typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production',
          jsx: true,
        })

        const result = await evaluate(compiled, {
          ...runtime,
        })

        if (result.default) {
          setRenderedComponent(() => result.default)
        } else {
          setRenderedComponent(() => () => React.createElement('div', null, 'No content to render'))
        }
      } catch (err) {
        console.error('MDX compilation error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Compilation failed'
        setCompileError(errorMessage)
        setRenderedComponent(() => () => React.createElement('div', null, `Error: ${errorMessage}`))
      } finally {
        setIsLoading(false)
      }
    }

    compileAndRender()
  }, [content])

  const containerStyle = {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    backgroundColor: theme === 'github-dark' ? '#0d1117' : '#ffffff',
    color: theme === 'github-dark' ? '#e1e4e8' : '#24292f',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '1.6',
  }

  if (error) {
    return (
      <div className="mdxui-error" style={{ ...containerStyle, color: '#f85149' }}>
        Error: {error}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mdxui-loading" style={containerStyle}>
        Compiling MDX...
      </div>
    )
  }

  if (compileError) {
    return (
      <div className="mdxui-compile-error" style={{ ...containerStyle, color: '#f85149' }}>
        <h3>MDX Compilation Error</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', fontFamily: 'Monaco, Menlo, monospace' }}>
          {compileError}
        </pre>
      </div>
    )
  }

  return (
    <div className="mdxui-preview-mode" style={containerStyle}>
      {RenderedComponent && <RenderedComponent />}
    </div>
  )
}
