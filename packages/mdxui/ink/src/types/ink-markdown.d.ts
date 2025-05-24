declare module 'ink-markdown' {
  import { FC } from 'react'

  interface MarkdownProps {
    children: string
  }

  const Markdown: FC<MarkdownProps>
  export default Markdown
}
