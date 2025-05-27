import React from 'react'
import { Slides as RevealSlides, Slide as RevealSlide } from '../reveal/src/index.js'
import { Slides as InkSlides, Slide as InkSlide } from '../ink/src/index.js'

export interface SlidesOptions {
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

export interface UnifiedSlidesProps {
  children: React.ReactNode
  options?: SlidesOptions
}

export interface UnifiedSlideProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  index?: number
  total?: number
}

/**
 * Environment-aware Slides component that renders the appropriate implementation
 * based on whether it's running in a browser or terminal environment
 */
export function Slides(props: UnifiedSlidesProps) {
  const { children, options } = props
  
  if (typeof window !== 'undefined') {
    return <RevealSlides options={options}>{children}</RevealSlides>
  }
  
  // @ts-ignore - Handle React 18 vs 19 type compatibility
  return <InkSlides options={options}>{children}</InkSlides>
}

/**
 * Environment-aware Slide component that renders the appropriate implementation
 * based on whether it's running in a browser or terminal environment
 */
export function Slide(props: UnifiedSlideProps) {
  const { children, className, style, index, total } = props
  
  if (typeof window !== 'undefined') {
    return <RevealSlide className={className} style={style}>{children}</RevealSlide>
  }
  
  // @ts-ignore - Handle React 18 vs 19 type compatibility
  return <InkSlide index={index} total={total}>{children}</InkSlide>
}
