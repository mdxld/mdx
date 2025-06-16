import React, { useState, useEffect, useCallback } from 'react'
import { BrowserComponentProps } from './types'
import { BrowseMode } from './modes/BrowseMode'
import { EditMode } from './modes/EditMode'
import { PreviewMode } from './modes/PreviewMode'

export const BrowserComponent: React.FC<BrowserComponentProps> = ({
  mode,
  content,
  language = 'markdown',
  theme = 'github-dark',
  onContentChange,
  onNavigate,
  onSave,
  saveEndpoint,
  readOnly = false,
  className = '',
  style = {},
}) => {
  const [currentContent, setCurrentContent] = useState(content)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentContent(content)
  }, [content])

  const handleContentChange = useCallback((newContent: string) => {
    setCurrentContent(newContent)
    onContentChange?.(newContent)
  }, [onContentChange])

  const handleSave = useCallback(async () => {
    if (!onSave && !saveEndpoint) return

    setIsLoading(true)
    setError(null)

    try {
      if (onSave) {
        await onSave(currentContent)
      } else if (saveEndpoint) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...saveEndpoint.headers,
        }

        if (saveEndpoint.auth) {
          switch (saveEndpoint.auth.type) {
            case 'bearer':
              if (saveEndpoint.auth.token) {
                headers['Authorization'] = `Bearer ${saveEndpoint.auth.token}`
              }
              break
            case 'basic':
              if (saveEndpoint.auth.username && saveEndpoint.auth.password) {
                const credentials = btoa(`${saveEndpoint.auth.username}:${saveEndpoint.auth.password}`)
                headers['Authorization'] = `Basic ${credentials}`
              }
              break
            case 'api-key':
              if (saveEndpoint.auth.apiKey && saveEndpoint.auth.apiKeyHeader) {
                headers[saveEndpoint.auth.apiKeyHeader] = saveEndpoint.auth.apiKey
              }
              break
          }
        }

        const requestBody = saveEndpoint.transformRequest 
          ? saveEndpoint.transformRequest(currentContent)
          : JSON.stringify({ content: currentContent })

        const response = await fetch(saveEndpoint.url, {
          method: saveEndpoint.method,
          headers,
          body: requestBody,
        })

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.text()
            if (errorData) {
              errorMessage += ` - ${errorData}`
            }
          } catch (parseError) {
            console.debug('Failed to parse error response:', parseError)
          }
          const error = new Error(errorMessage)
          saveEndpoint.onError?.(error)
          throw error
        }

        saveEndpoint.onSuccess?.(response)
        const responseData = await response.text()
        console.log('Save successful:', responseData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed'
      setError(errorMessage)
      console.error('Save error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentContent, onSave, saveEndpoint])

  const handleNavigate = useCallback((url: string) => {
    if (onNavigate) {
      onNavigate(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [onNavigate])

  const commonProps = {
    content: currentContent,
    language,
    theme,
    onContentChange: handleContentChange,
    onNavigate: handleNavigate,
    onSave: handleSave,
    readOnly,
    isLoading,
    error,
  }

  const containerClassName = `mdxui-browser ${className}`.trim()
  const containerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    ...style,
  }

  return (
    <div className={containerClassName} style={containerStyle}>
      {mode === 'browse' && <BrowseMode {...commonProps} />}
      {mode === 'edit' && <EditMode {...commonProps} />}
      {mode === 'preview' && <PreviewMode {...commonProps} />}
    </div>
  )
}
