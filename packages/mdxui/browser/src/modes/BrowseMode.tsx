import React, { useEffect, useState } from 'react'
import { highlight, type HighlightedCode } from 'codehike/code'

interface BrowseModeProps {
  content: string
  language: string
  theme: string
  onNavigate: (url: string) => void
  error: string | null
}

export const BrowseMode: React.FC<BrowseModeProps> = ({
  content,
  language,
  theme,
  onNavigate,
  error,
}) => {
  const [highlightedCode, setHighlightedCode] = useState<HighlightedCode | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const highlightContent = async () => {
      setIsLoading(true)
      try {
        const themeObj = typeof theme === 'string' ? { name: theme, colors: {} } : theme
        const highlighted = await highlight(
          {
            value: content,
            lang: language,
            meta: '',
          },
          themeObj
        )
        setHighlightedCode(highlighted)
      } catch (err) {
        console.error('Highlighting error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    highlightContent()
  }, [content, language, theme])

  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'A') {
      event.preventDefault()
      const href = target.getAttribute('href')
      if (href) {
        if (href.startsWith('http://') || href.startsWith('https://')) {
          onNavigate(href)
        } else if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
          onNavigate(href)
        } else if (href.startsWith('#')) {
          const element = document.getElementById(href.substring(1))
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        } else {
          onNavigate(href)
        }
      }
    }
  }

  const processContentWithLinks = (htmlContent: string) => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    
    let processedContent = htmlContent.replace(markdownLinkRegex, (match, text, url) => {
      return `<a href="${url}" class="mdxui-link" style="color: #58a6ff; text-decoration: underline; cursor: pointer;">${text}</a>`
    })
    
    processedContent = processedContent.replace(urlRegex, (url) => {
      if (processedContent.includes(`href="${url}"`)) {
        return url
      }
      return `<a href="${url}" class="mdxui-link" style="color: #58a6ff; text-decoration: underline; cursor: pointer;">${url}</a>`
    })
    
    return processedContent
  }

  if (error) {
    return (
      <div className="mdxui-error" style={{ padding: '16px', color: '#f85149', backgroundColor: '#0d1117' }}>
        Error: {error}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mdxui-loading" style={{ padding: '16px', color: '#e1e4e8', backgroundColor: '#0d1117' }}>
        Loading...
      </div>
    )
  }

  return (
    <div 
      className="mdxui-browse-mode"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#0d1117',
        color: '#e1e4e8',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.5',
        padding: '16px',
      }}
      onClick={handleLinkClick}
    >
      {highlightedCode ? (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', ...highlightedCode.style }}>
          <code>
            {highlightedCode.tokens.map((token, index) => {
              if (typeof token === 'string') {
                return token
              }
              const [value, color, style] = token
              return (
                <span key={index} style={{ color, ...style }}>
                  {value}
                </span>
              )
            })}
          </code>
        </pre>
      ) : (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          <div
            dangerouslySetInnerHTML={{
              __html: processContentWithLinks(content)
            }}
          />
        </pre>
      )}
    </div>
  )
}
