'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils.js'

export interface AuroraTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  colors?: string[]
  blur?: number
  speed?: number
  textClassName?: string
}

export const AuroraText = React.forwardRef<HTMLDivElement, AuroraTextProps>(
  (
    {
      text,
      colors = ['rgba(76, 0, 255, 0.5)', 'rgba(0, 183, 255, 0.5)', 'rgba(0, 255, 128, 0.5)'],
      blur = 100,
      speed = 10,
      className,
      textClassName,
      ...props
    },
    ref,
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [position, setPosition] = React.useState({ x: 0, y: 0 })

    React.useEffect(() => {
      const interval = setInterval(() => {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect()
          setPosition({
            x: Math.random() * width,
            y: Math.random() * height,
          })
        }
      }, 1000 / speed)

      return () => clearInterval(interval)
    }, [speed])

    return (
      <div
        ref={(node) => {
          if (ref) {
            if (typeof ref === 'function') {
              ref(node)
            } else {
              ref.current = node
            }
          }
          containerRef.current = node
        }}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        {colors.map((color, index) => (
          <div
            key={index}
            className='absolute inset-0 opacity-50 mix-blend-screen'
            style={{
              background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${color} 0%, transparent 50%)`,
              filter: `blur(${blur}px)`,
              transform: `translate(${(index - 1) * 10}%, ${(index - 1) * 10}%)`,
              transition: `transform ${1 / speed}s ease-out`,
            }}
          />
        ))}
        <div className={cn('relative z-10', textClassName)}>{text}</div>
      </div>
    )
  },
)

AuroraText.displayName = 'AuroraText'
