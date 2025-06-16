import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserComponent } from './BrowserComponent'
import type { BrowserComponentProps, BrowserMode, SimplifiedBrowserOptions } from './types'

export { BrowserComponent }
export type { BrowserComponentProps, BrowserMode, SimplifiedBrowserOptions }

export function render(elementId: string, options: SimplifiedBrowserOptions): void {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const reactElement = React.createElement(BrowserComponent, {
    mode: options.mode || 'browse',
    content: options.content,
    language: options.language || 'markdown',
    theme: options.theme || 'github-dark',
    onContentChange: options.onContentChange,
    onNavigate: options.onNavigate,
    onSave: options.onSave,
    readOnly: options.readOnly || false,
    className: options.className || '',
    style: options.style || {},
  })

  const root = createRoot(element)
  root.render(reactElement)
}
