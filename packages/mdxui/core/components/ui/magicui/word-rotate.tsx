'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils.js'
import { motion } from 'framer-motion'

export interface WordRotateProps extends React.HTMLAttributes<HTMLDivElement> {
  prefix?: string
  words: string[]
  interval?: number
  className?: string
  prefixClassName?: string
  wordClassName?: string
}

export const WordRotate = React.forwardRef<HTMLDivElement, WordRotateProps>(
  ({ prefix = '', words = [], interval = 2000, className, prefixClassName, wordClassName, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0)

    React.useEffect(() => {
      if (words.length <= 1) return

      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length)
      }, interval)

      return () => clearInterval(timer)
    }, [words, interval])

    const variants = {
      enter: { y: 20, opacity: 0 },
      center: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
    }

    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        {prefix && <span className={cn('mr-2', prefixClassName)}>{prefix}</span>}
        <div className='relative h-[1.2em] overflow-hidden'>
          <motion.div
            key={currentIndex}
            initial='enter'
            animate='center'
            exit='exit'
            variants={variants}
            transition={{ duration: 0.3 }}
            className={cn('absolute', wordClassName)}
          >
            {words[currentIndex]}
          </motion.div>
        </div>
      </div>
    )
  },
)

WordRotate.displayName = 'WordRotate'
