'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils.js'

export interface TypingAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  typingSpeed?: number
  deletingSpeed?: number
  delayBeforeDelete?: number
  delayBeforeType?: number
  repeat?: boolean
  cursor?: string
  cursorClassName?: string
  textClassName?: string
}

export const TypingAnimation = React.forwardRef<HTMLDivElement, TypingAnimationProps>(
  (
    {
      text,
      typingSpeed = 150,
      deletingSpeed = 75,
      delayBeforeDelete = 1000,
      delayBeforeType = 500,
      repeat = true,
      cursor = '|',
      className,
      cursorClassName,
      textClassName,
      ...props
    },
    ref,
  ) => {
    const [displayText, setDisplayText] = React.useState('')
    const [isTyping, setIsTyping] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isPaused, setIsPaused] = React.useState(false)

    React.useEffect(() => {
      let timeout: NodeJS.Timeout

      if (isPaused) {
        timeout = setTimeout(() => {
          setIsPaused(false)
          setIsDeleting(true)
        }, delayBeforeDelete)
        return () => clearTimeout(timeout)
      }

      if (isTyping && !isDeleting) {
        if (displayText.length < text.length) {
          timeout = setTimeout(() => {
            setDisplayText(text.substring(0, displayText.length + 1))
          }, typingSpeed)
        } else {
          setIsTyping(false)
          setIsPaused(true)
        }
      } else if (isDeleting) {
        if (displayText.length > 0) {
          timeout = setTimeout(() => {
            setDisplayText(text.substring(0, displayText.length - 1))
          }, deletingSpeed)
        } else {
          setIsDeleting(false)
          if (repeat) {
            timeout = setTimeout(() => {
              setIsTyping(true)
            }, delayBeforeType)
          }
        }
      }

      return () => clearTimeout(timeout)
    }, [displayText, text, isTyping, isDeleting, isPaused, typingSpeed, deletingSpeed, delayBeforeDelete, delayBeforeType, repeat])

    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        <span className={cn('', textClassName)}>{displayText}</span>
        <span className={cn('animate-blink ml-0.5', cursorClassName)} style={{ animationDuration: '1s' }}>
          {cursor}
        </span>
      </div>
    )
  },
)

TypingAnimation.displayName = 'TypingAnimation'
