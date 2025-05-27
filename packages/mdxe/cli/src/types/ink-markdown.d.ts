declare module 'ink-markdown' {
  import React from 'react'

  interface MarkdownProps {
    children: string
  }

  const Markdown: React.FC<MarkdownProps>

  export default Markdown
}
