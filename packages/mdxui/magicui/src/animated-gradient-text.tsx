'use client'

import * as React from 'react'
import { cn } from './lib/utils.js'

export interface AnimatedGradientTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  gradient?: string
  className?: string
  textClassName?: string
  duration?: number
  animate?: boolean
}

export const AnimatedGradientText = React.forwardRef<HTMLDivElement, AnimatedGradientTextProps>(
  ({ text, gradient = 'linear-gradient(to right, #00DBDE, #FC00FF, #00DBDE)', className, textClassName, duration = 3, animate = true, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <div
          className={cn('bg-clip-text text-transparent', animate && 'animate-gradient', textClassName)}
          style={{
            backgroundImage: gradient,
            backgroundSize: '200% auto',
            ...(animate && {
              animation: `gradient ${duration}s linear infinite`,
            }),
          }}
        >
          {text}
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes gradient {
            0% {
              background-position: 0% center;
            }
            100% {
              background-position: 200% center;
            }
          }
        `,
          }}
        />
      </div>
    )
  },
)

AnimatedGradientText.displayName = 'AnimatedGradientText'
