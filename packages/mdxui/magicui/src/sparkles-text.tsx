'use client'

import * as React from 'react'
import { cn } from './lib/utils.js'
import { motion } from 'framer-motion'

export interface SparklesTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  sparkleColor?: string
  sparkleSize?: number
  sparkleCount?: number
  className?: string
  textClassName?: string
}

export const SparklesText = React.forwardRef<HTMLDivElement, SparklesTextProps>(
  ({ text, sparkleColor = '#FFD700', sparkleSize = 4, sparkleCount = 20, className, textClassName, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [sparkles, setSparkles] = React.useState<
      {
        id: number
        x: number
        y: number
        size: number
        opacity: number
      }[]
    >([])

    React.useEffect(() => {
      if (!containerRef.current) return

      const { width, height } = containerRef.current.getBoundingClientRect()
      const newSparkles = []

      for (let i = 0; i < sparkleCount; i++) {
        newSparkles.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * sparkleSize + 1,
          opacity: Math.random() * 0.8 + 0.2,
        })
      }

      setSparkles(newSparkles)

      const interval = setInterval(() => {
        setSparkles((prev) =>
          prev.map((sparkle) => ({
            ...sparkle,
            opacity: Math.random() * 0.8 + 0.2,
          })),
        )
      }, 1000)

      return () => clearInterval(interval)
    }, [sparkleCount, sparkleSize])

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
        {...props}
      >
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className='absolute rounded-full'
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size,
              height: sparkle.size,
              backgroundColor: sparkleColor,
            }}
            animate={{
              opacity: [sparkle.opacity, 0, sparkle.opacity],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
        <div className={cn('relative z-10', textClassName)}>{text}</div>
      </div>
    )
  },
)

SparklesText.displayName = 'SparklesText'
