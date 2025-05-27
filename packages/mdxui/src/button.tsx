import React from 'react'
import { Button as CoreButton } from '../core/components/button.js'
import { Button as InkButton } from '../ink/src/button.js'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'text'
}

export function Button(props: ButtonProps) {
  if (typeof window !== 'undefined') {
    return <CoreButton {...props} />
  }
  
  // @ts-ignore - Handle React 18 vs 19 type compatibility
  return <InkButton {...props} />
}
