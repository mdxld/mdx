'use client'

import * as React from 'react'
import { cn } from './lib/utils.js'
import { motion } from 'framer-motion'

export interface SpinningTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  direction?: 'clockwise' | 'counterclockwise'
  speed?: number
  className?: string
  textClassName?: string
  radius?: number
  startAngle?: number
}

export const SpinningText = React.forwardRef<HTMLDivElement, SpinningTextProps>(
  ({ text, direction = 'clockwise', speed = 10, className, textClassName, radius = 100, startAngle = 0, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const characters = text.split('')
    const angleStep = 360 / characters.length

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
        className={cn('relative', className)}
        style={{
          width: radius * 2,
          height: radius * 2,
        }}
        {...props}
      >
        <motion.div
          className='absolute inset-0'
          animate={{
            rotate: direction === 'clockwise' ? 360 : -360,
          }}
          transition={{
            duration: 60 / speed,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {characters.map((char, index) => {
            const angle = startAngle + index * angleStep
            const radians = (angle * Math.PI) / 180
            const x = radius + radius * Math.cos(radians)
            const y = radius + radius * Math.sin(radians)

            return (
              <div
                key={`${char}-${index}`}
                className={cn('absolute transform -translate-x-1/2 -translate-y-1/2', textClassName)}
                style={{
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                }}
              >
                {char}
              </div>
            )
          })}
        </motion.div>
      </div>
    )
  },
)

SpinningText.displayName = 'SpinningText'
