declare module '@mdxui/ink/src/markdown' {
  import React from 'react'

  interface MarkdownProps {
    children: string
  }

  const Markdown: React.FC<MarkdownProps>
  export default Markdown
}

declare module '@mdxui/ink/src/ascii' {
  import React from 'react'

  interface AsciiProps {
    children: string
    font?: string
  }

  const Ascii: React.FC<AsciiProps>
  export default Ascii
}
