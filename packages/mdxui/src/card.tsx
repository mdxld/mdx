import React from 'react'
import { Card as CoreCard } from '../core/components/card.js'
import { Card as InkCard } from '../ink/src/card.js'

export interface CardProps {
  title: string
  children: React.ReactNode
  href: string
}

export function Card(props: CardProps) {
  if (typeof window !== 'undefined') {
    return <CoreCard {...props} />
  }
  
  return <InkCard {...props} />
}
