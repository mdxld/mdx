'use client'

import * as React from 'react'
import { cn } from './lib/utils.js'

export interface AnimatedShinyTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  gradient?: string
  duration?: number
  className?: string
  textClassName?: string
}

export const AnimatedShinyText = React.forwardRef<HTMLDivElement, AnimatedShinyTextProps>(
  ({ text, gradient = 'linear-gradient(90deg, #000, #fff, #000)', duration = 3, className, textClassName, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <div
          className={cn('animate-shine relative bg-clip-text text-transparent', textClassName)}
          style={{
            backgroundImage: gradient,
            backgroundSize: '200% 100%',
            animation: `shine ${duration}s linear infinite`,
          }}
        >
          {text}
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes shine {
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

AnimatedShinyText.displayName = 'AnimatedShinyText'
