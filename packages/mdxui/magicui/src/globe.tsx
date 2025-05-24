'use client'

import * as React from 'react'
import { cn } from './lib/utils.js'
import { motion, useAnimation } from 'framer-motion'

export interface GlobeProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  color?: string
  dotSize?: number
  dotColor?: string
  dotSpacing?: number
  animationSpeed?: number
}

export const Globe = React.forwardRef<HTMLDivElement, GlobeProps>(
  ({ size = 300, color = 'currentColor', dotSize = 2, dotColor = 'currentColor', dotSpacing = 15, animationSpeed = 10, className, ...props }, ref) => {
    const controls = useAnimation()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [dots, setDots] = React.useState<Array<{ x: number; y: number; z: number }>>([])

    React.useEffect(() => {
      const generateDots = () => {
        const newDots = []
        const numDots = Math.floor((size * size) / (dotSpacing * dotSpacing))

        for (let i = 0; i < numDots; i++) {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)

          const x = Math.sin(phi) * Math.cos(theta)
          const y = Math.sin(phi) * Math.sin(theta)
          const z = Math.cos(phi)

          newDots.push({ x, y, z })
        }

        setDots(newDots)
      }

      generateDots()

      controls.start({
        rotateY: 360,
        transition: {
          duration: 60 / animationSpeed,
          repeat: Infinity,
          ease: 'linear',
        },
      })
    }, [size, dotSpacing, controls, animationSpeed])

    return (
      <div ref={ref} className={cn('relative', className)} style={{ width: size, height: size }} {...props}>
        <motion.div
          ref={containerRef}
          animate={controls}
          className='absolute inset-0 flex items-center justify-center'
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid ${color}`,
          }}
        >
          {dots.map((dot, index) => {
            const scale = (dot.z + 1) / 2
            const x = dot.x * (size / 2 - dotSize)
            const y = dot.y * (size / 2 - dotSize)

            return (
              <div
                key={index}
                className='absolute rounded-full'
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: dotColor,
                  opacity: scale,
                  transform: `translate(${x}px, ${y}px)`,
                  left: size / 2,
                  top: size / 2,
                }}
              />
            )
          })}
        </motion.div>
      </div>
    )
  },
)

Globe.displayName = 'Globe'
