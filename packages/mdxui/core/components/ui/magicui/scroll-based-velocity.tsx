'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils.js'
import { motion, useScroll, useTransform } from 'framer-motion'

export interface ScrollBasedVelocityProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  direction?: 'horizontal' | 'vertical'
  factor?: number
  className?: string
  textClassName?: string
}

export const ScrollBasedVelocity = React.forwardRef<HTMLDivElement, ScrollBasedVelocityProps>(
  ({ text, direction = 'horizontal', factor = 1, className, textClassName, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ['start end', 'end start'],
    })

    const x = useTransform(scrollYProgress, [0, 1], direction === 'horizontal' ? [-100 * factor, 100 * factor] : [0, 0])

    const y = useTransform(scrollYProgress, [0, 1], direction === 'vertical' ? [-100 * factor, 100 * factor] : [0, 0])

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
        <motion.div className={cn('', textClassName)} style={{ x, y }}>
          {text}
        </motion.div>
      </div>
    )
  },
)

ScrollBasedVelocity.displayName = 'ScrollBasedVelocity'
