'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils.js'

export interface LineShadowTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  shadowColor?: string
  shadowWidth?: number
  shadowOffset?: number
  shadowBlur?: number
  textClassName?: string
}

export const LineShadowText = React.forwardRef<HTMLDivElement, LineShadowTextProps>(
  ({ text, shadowColor = 'rgba(0, 0, 0, 0.2)', shadowWidth = 1, shadowOffset = 4, shadowBlur = 0, className, textClassName, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <div
          className={cn('absolute left-0 top-0 select-none', textClassName)}
          style={{
            WebkitTextStroke: `${shadowWidth}px ${shadowColor}`,
            textShadow: `0 ${shadowOffset}px ${shadowBlur}px ${shadowColor}`,
            color: 'transparent',
          }}
          aria-hidden='true'
        >
          {text}
        </div>
        <div className={cn('relative', textClassName)}>{text}</div>
      </div>
    )
  },
)

LineShadowText.displayName = 'LineShadowText'
