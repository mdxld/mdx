'use client'

import * as React from 'react'
import { cn } from './lib/utils.js'
import { motion } from 'framer-motion'

export interface BoxRevealProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  delay?: number
  className?: string
  revealClassName?: string
  once?: boolean
  animateOnView?: boolean
  id?: string
  style?: React.CSSProperties
}

export const BoxReveal = React.forwardRef<HTMLDivElement, BoxRevealProps>(
  ({ children, direction = 'left', duration = 0.5, delay = 0, className, revealClassName, once = true, animateOnView = true, id, style }, ref) => {
    const directionMap = {
      left: { x: '-100%', y: 0 },
      right: { x: '100%', y: 0 },
      up: { x: 0, y: '-100%' },
      down: { x: 0, y: '100%' },
    }

    const variants = {
      hidden: {
        opacity: 0,
      },
      visible: {
        opacity: 1,
        transition: {
          delay,
          duration,
        },
      },
    }

    const revealVariants = {
      hidden: {
        x: directionMap[direction].x,
        y: directionMap[direction].y,
      },
      visible: {
        x: 0,
        y: 0,
        transition: {
          delay,
          duration,
          ease: 'easeInOut',
        },
      },
    }

    return (
      <motion.div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        variants={variants}
        initial='hidden'
        animate={animateOnView ? undefined : 'visible'}
        whileInView={animateOnView ? 'visible' : undefined}
        viewport={{ once }}
        id={id}
        style={style}
      >
        {children}
        <motion.div
          className={cn('absolute inset-0 z-10 bg-background', revealClassName)}
          variants={revealVariants}
          initial='hidden'
          animate={animateOnView ? undefined : 'visible'}
          whileInView={animateOnView ? 'visible' : undefined}
          viewport={{ once }}
        />
      </motion.div>
    )
  },
)

BoxReveal.displayName = 'BoxReveal'
