# @mdxui/browser

A React component for browsing, editing, and previewing MDX content with syntax highlighting and Monaco editor integration.

## Installation

```bash
npm install @mdxui/browser
# or
pnpm add @mdxui/browser
```

## Usage

### Simplified API (Recommended)

The easiest way to use @mdxui/browser is with the simplified `render` function:

```html
<script src="https://unpkg.com/@mdxui/browser/dist/index.umd.js"></script>
<script>
  // One-line render function
  MdxuiBrowser.render('container', {
    mode: 'browse',
    content: '# Hello World\n\nThis is a sample markdown document.'
  })
</script>
```

#### Simplified API Options

```javascript
MdxuiBrowser.render(elementId, {
  mode: 'browse',           // 'browse' | 'edit' | 'preview' (default: 'browse')
  content: string,          // Required: MDX/Markdown content
  language: 'markdown',     // Language for syntax highlighting (default: 'markdown')
  theme: 'github-dark',     // Editor theme (default: 'github-dark')
  onContentChange: (content) => console.log('Content changed:', content),
  onNavigate: (url) => console.log('Navigate to:', url),
  onSave: async (content) => console.log('Save:', content),
  readOnly: false,          // Whether editor is read-only (default: false)
  className: 'my-class',    // CSS class name
  style: { height: '400px' } // Inline styles
})
```

### Original API (Advanced Usage)

For more advanced use cases, you can use the original React component API:

```javascript
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserComponent } from '@mdxui/browser'

const element = React.createElement(BrowserComponent, {
  mode: 'browse',
  content: '# Hello World',
  language: 'markdown',
  theme: 'github-dark',
  onContentChange: (content) => console.log('Content changed:', content),
  onNavigate: (url) => console.log('Navigate to:', url),
  onSave: async (content) => console.log('Save:', content),
  readOnly: false,
  className: 'browser-component',
  style: { height: '100%' }
})

const root = createRoot(document.getElementById('container'))
root.render(element)
```

## Features

- **Browse Mode**: View rendered MDX/Markdown with syntax highlighting
- **Edit Mode**: Edit content using Monaco editor with IntelliSense
- **Preview Mode**: See live preview of rendered content
- **Syntax Highlighting**: Support for multiple languages and themes
- **Navigation**: Handle internal and external link navigation
- **Save Functionality**: Built-in save callbacks with async support
- **Responsive**: Works on desktop and mobile devices

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'browse' \| 'edit' \| 'preview'` | `'browse'` | Display mode |
| `content` | `string` | - | MDX/Markdown content (required) |
| `language` | `string` | `'markdown'` | Language for syntax highlighting |
| `theme` | `string` | `'github-dark'` | Editor theme |
| `onContentChange` | `(content: string) => void` | - | Called when content changes |
| `onNavigate` | `(url: string) => void` | - | Called when navigation occurs |
| `onSave` | `(content: string) => Promise<void>` | - | Called when save is triggered |
| `readOnly` | `boolean` | `false` | Whether editor is read-only |
| `className` | `string` | - | CSS class name |
| `style` | `React.CSSProperties` | - | Inline styles |

## Examples

### Basic Usage
```javascript
MdxuiBrowser.render('my-container', {
  content: '# Welcome\n\nThis is **bold** text.'
})
```

### Edit Mode with Save
```javascript
MdxuiBrowser.render('editor-container', {
  mode: 'edit',
  content: '# Edit me!',
  onSave: async (content) => {
    await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify({ content }),
      headers: { 'Content-Type': 'application/json' }
    })
    alert('Saved successfully!')
  }
})
```

### Custom Theme and Styling
```javascript
MdxuiBrowser.render('styled-container', {
  content: '# Custom Styled',
  theme: 'vs-light',
  className: 'my-browser',
  style: { 
    height: '500px',
    border: '1px solid #ccc',
    borderRadius: '8px'
  }
})
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

MIT
