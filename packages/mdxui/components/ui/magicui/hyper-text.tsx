'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils.js'

export interface HyperTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  glowColor?: string
  glowSize?: number
  glowIntensity?: number
  className?: string
  textClassName?: string
}

export const HyperText = React.forwardRef<HTMLDivElement, HyperTextProps>(
  ({ text, glowColor = 'rgba(255, 255, 255, 0.8)', glowSize = 10, glowIntensity = 0.5, className, textClassName, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)

    return (
      <div ref={ref} className={cn('relative', className)} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} {...props}>
        <div
          className={cn('transition-all duration-300', textClassName)}
          style={{
            textShadow: isHovered ? `0 0 ${glowSize}px ${glowColor}` : 'none',
            filter: isHovered ? `brightness(${1 + glowIntensity})` : 'brightness(1)',
          }}
        >
          {text}
        </div>
      </div>
    )
  },
)

HyperText.displayName = 'HyperText'
