import React from 'react'
import { Slides as RevealSlides, Slide as RevealSlide } from '../reveal/src/index.js'
import { Slides as InkSlides, Slide as InkSlide } from '../ink/src/index.js'

interface UnifiedSlidesProps {
  children: React.ReactNode
  options?: {
    plugins?: any[]
    hash?: boolean
    slideNumber?: boolean
    showHelp?: boolean
    colors?: {
      title?: string
      content?: string
      help?: string
      slideNumber?: string
    }
    [key: string]: any
  }
}

interface UnifiedSlideProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  index?: number
  total?: number
}

export function Slides({ children, options }: UnifiedSlidesProps) {
  if (typeof window !== 'undefined') {
    return <RevealSlides options={options}>{children}</RevealSlides>
  }
  
  return <InkSlides options={options}>{children}</InkSlides>
}

export function Slide(props: UnifiedSlideProps) {
  if (typeof window !== 'undefined') {
    return <RevealSlide {...props} />
  }
  
  return <InkSlide {...props} />
}
