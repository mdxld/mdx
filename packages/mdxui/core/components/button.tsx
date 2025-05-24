import React, { type ButtonHTMLAttributes } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'text'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  let variantClasses = ''
  switch (variant) {
    case 'secondary':
      variantClasses = 'bg-gray-100 text-gray-900 hover:bg-gray-200'
      break
    case 'text':
      variantClasses = 'bg-transparent text-blue-600 hover:underline'
      break
    default:
      variantClasses = 'bg-blue-600 text-white hover:bg-blue-700'
  }
  return <button className={`rounded px-4 py-2 text-sm font-medium ${variantClasses} ${className}`} {...props} />
}
