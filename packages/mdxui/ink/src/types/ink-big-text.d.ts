declare module 'ink-big-text' {
  import { FC } from 'react'

  interface BigTextProps {
    text: string
    font?: string
    colors?: string[]
    align?: 'left' | 'center' | 'right'
  }

  const BigText: FC<BigTextProps>
  export default BigText
}
