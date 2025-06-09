import React, { useState, useEffect, useMemo } from 'react'
import { Text as InkText, Box } from 'ink'
import type { TextProps, BoxProps } from 'ink'
import chalk from 'chalk'
import * as ReactDOMServer from 'react-dom/server'
import { IconName, getIconLibrary, ICON_LIBRARIES } from './icons'

/**
 * Text component with chalk styling
 */
export function Text({ color, ...props }: TextProps & { color?: string }) {
  if (color) {
    return <InkText {...props} color={color} />
  }

  return <InkText {...props} />
}

/**
 * Box component with chalk styling
 */
export function PastelBox({ borderColor, ...props }: BoxProps & { borderColor?: string }) {
  if (borderColor) {
    return <Box {...props} borderColor={borderColor} />
  }

  return <Box {...props} />
}

/**
 * Props for the Image component
 */
export interface ImageProps {
  icon?: React.ComponentType<any>
  svg?: string
  src?: string // Add support for standard img src attribute
  alt?: string // Add support for alt text
  width?: number
  height?: number
  color?: string
  fallback?: 'ascii' | 'unicode'
}

/**
 * Utility function to wrap SVG components for terminal rendering
 */
export function wrapSvgComponent(Component: React.ComponentType<any>) {
  return function WrappedSvgComponent(props: any) {
    return <Image icon={Component} width={props.size || 24} color={props.color} />
  }
}

/**
 * Image component that renders SVG icons as ASCII art
 */
export function Image({ icon: Icon, svg, src, alt, width = 20, height, color = 'white', fallback = 'ascii' }: ImageProps) {
  const [asciiArt, setAsciiArt] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  if (Icon && !svg && !src) {
    try {
      ReactDOMServer.renderToStaticMarkup(<Icon color={color} size={width} />)
    } catch (err) {
      return <Text color='red'>[Image Error: Failed to render icon: {err instanceof Error ? err.message : String(err)}]</Text>
    }
  }

  const svgString = useMemo(() => {
    if (svg) return svg
    if (!Icon && !src) return ''
    if (src && src.endsWith('.svg')) return '' // Will be handled by the src useEffect

    return Icon ? ReactDOMServer.renderToStaticMarkup(<Icon color={color} size={width} />) : ''
  }, [Icon, svg, src, color, width])

  useEffect(() => {
    if (src && !svg && !Icon) {
      const isSvg = src.endsWith('.svg')

      if (isSvg) {
        fetch(src)
          .then((response) => response.text())
          .then((svgContent) => {
            setAsciiArt('') // Clear any existing ASCII art
            const options: any = {
              fit: 'box',
              width,
              height: height || width,
              format: 'string',
              color: false,
            }

            const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`

            return import('asciify-image').then((asciifyModule) => {
              const asciifyImage = asciifyModule.default || asciifyModule
              return asciifyImage(svgDataUrl, options)
            })
          })
          .then((asciiResult: string | string[]) => {
            if (typeof asciiResult === 'string') {
              setAsciiArt(asciiResult)
              setError(null)
            } else if (Array.isArray(asciiResult)) {
              setAsciiArt(asciiResult.join('\n'))
              setError(null)
            }
          })
          .catch((err) => {
            setError(`Failed to load SVG image: ${err?.message || String(err)}`)
          })
      } else {
        const options: any = {
          fit: 'box',
          width,
          height: height || width,
          format: 'string',
          color: false,
        }

        import('asciify-image')
          .then((asciifyModule) => {
            const asciifyImage = asciifyModule.default || asciifyModule
            return asciifyImage(src, options)
          })
          .then((asciiResult: string | string[]) => {
            if (typeof asciiResult === 'string') {
              setAsciiArt(asciiResult)
              setError(null)
            } else if (Array.isArray(asciiResult)) {
              setAsciiArt(asciiResult.join('\n'))
              setError(null)
            }
          })
          .catch((err) => {
            setError(`Failed to load image: ${err?.message || String(err)}`)
          })
      }
    }
  }, [src, svg, Icon, width, height])

  useEffect(() => {
    if (!svgString) return

    const calculatedHeight = height || width

    // Convert SVG to ASCII art
    const options: any = {
      fit: 'box',
      width,
      height: calculatedHeight,
      format: 'string',
      color: false, // Terminal color will be handled by Ink
    }

    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`

    import('asciify-image')
      .then((asciifyModule) => {
        const asciifyImage = asciifyModule.default || asciifyModule
        return asciifyImage(svgDataUrl, options)
      })
      .then((asciiResult: string | string[]) => {
        if (typeof asciiResult === 'string') {
          setAsciiArt(asciiResult)
          setError(null)
        } else if (Array.isArray(asciiResult)) {
          setAsciiArt(asciiResult.join('\n'))
          setError(null)
        }
      })
      .catch((err: Error) => {
        if (err.message !== 'ASCII conversion error') {
          setAsciiArt('  ###\n #####\n#######')
          setError(null)
        } else {
          setError(`Failed to convert to ASCII: ${err.message || 'unknown error'}`)
        }
      })
  }, [svgString, width, height, fallback])

  if (error) {
    return <Text color='red'>[Image Error: {error}]</Text>
  }

  if (!svgString || !asciiArt) {
    return <Text>[Loading image...]</Text>
  }

  const lines = asciiArt.split('\n')

  return (
    <Box flexDirection='column'>
      {lines.map((line, index) => (
        <Text key={index} color={color}>
          {line}
        </Text>
      ))}
    </Box>
  )
}

/**
 * Props for the Icon component
 */
export interface IconProps extends Omit<ImageProps, 'icon'> {
  name: IconName
}

/**
 * Icon component that renders react-icons as ASCII art
 */
export function Icon({ name, ...imageProps }: IconProps) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const library = getIconLibrary(name)
        if (!library) {
          throw new Error(`Unknown icon library for icon: ${name}`)
        }

        const libraryPath = ICON_LIBRARIES[library]
        const iconModule = await import(libraryPath)

        if (!iconModule[name]) {
          throw new Error(`Icon ${name} not found in ${libraryPath}`)
        }

        setIconComponent(() => iconModule[name])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setIconComponent(null)
      }
    }

    loadIcon()
  }, [name])

  if (error) {
    return <Text color='red'>[Icon Error: {error}]</Text>
  }

  if (!IconComponent) {
    return <Text>[Loading icon {name}...]</Text>
  }

  return <Image icon={IconComponent} {...imageProps} />
}

import BigText from 'ink-big-text'
import { Children } from 'react'

let Table: any
let Link: any
let SyntaxHighlight: any

try {
  Table = require('ink-table').default || require('ink-table')
} catch {
  Table = ({ data }: { data: any[] }) => <Text>Table: {data.length} rows</Text>
}

try {
  Link = require('ink-link').default || require('ink-link')
} catch {
  Link = ({ url, children }: { url: string; children: React.ReactNode }) => (
    <Text color='blue'>
      {children} ({url})
    </Text>
  )
}

try {
  SyntaxHighlight = require('ink-syntax-highlight').default || require('ink-syntax-highlight')
} catch {
  SyntaxHighlight = ({ code }: { code: string }) => <Text backgroundColor='gray'>{code}</Text>
}

/**
 * Heading components (h1-h6)
 */
export function H1({ children }: { children: React.ReactNode }) {
  return <BigText text={String(children)} font='block' />
}

export function H2({ children }: { children: React.ReactNode }) {
  return <BigText text={String(children)} font='simple' />
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <Text bold underline>
      {children}
    </Text>
  )
}

export function H4({ children }: { children: React.ReactNode }) {
  return <Text bold>{children}</Text>
}

export function H5({ children }: { children: React.ReactNode }) {
  return (
    <Text bold color='gray'>
      {children}
    </Text>
  )
}

export function H6({ children }: { children: React.ReactNode }) {
  return <Text color='gray'>{children}</Text>
}

/**
 * Text formatting components
 */
export function Strong({ children }: { children: React.ReactNode }) {
  return <Text bold>{children}</Text>
}

export function Em({ children }: { children: React.ReactNode }) {
  return <Text italic>{children}</Text>
}

export function Del({ children }: { children: React.ReactNode }) {
  return <Text strikethrough>{children}</Text>
}

/**
 * List components
 */
export function Ul({ children }: { children: React.ReactNode }) {
  return (
    <Box flexDirection='column' paddingLeft={2}>
      {children}
    </Box>
  )
}

export function Ol({ children }: { children: React.ReactNode }) {
  return (
    <Box flexDirection='column' paddingLeft={2}>
      {Children.toArray(children).map((child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            index: index + 1,
          })
        }
        return child
      })}
    </Box>
  )
}

export function Li({ children, index }: { children: React.ReactNode; index?: number }) {
  const childArray = Children.toArray(children)
  if (childArray[0] && React.isValidElement(childArray[0]) && childArray[0].props && childArray[0].props.type === 'checkbox') {
    const checked = childArray[0].props.checked || childArray[0].props.defaultChecked
    const label = childArray.slice(1)
    return (
      <Text>
        {checked ? '[x]' : '[ ]'} {label}
      </Text>
    )
  }

  if (index) {
    return (
      <Text>
        {index}. {children}
      </Text>
    )
  }

  return <Text>• {children}</Text>
}

/**
 * Code components
 */
export function Code({ children, className }: { children: React.ReactNode; className?: string }) {
  const isCodeBlock = className && className.startsWith('language-')

  if (isCodeBlock) {
    const language = className.replace('language-', '')
    return <SyntaxHighlight code={String(children)} language={language} />
  }

  return (
    <Text backgroundColor='gray' color='black'>
      {children}
    </Text>
  )
}

export function Pre({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/**
 * Table components
 */
export function TableComponent({ children }: { children: React.ReactNode }) {
  const headers: string[] = []
  const rows: Record<string, any>[] = []

  Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === 'thead') {
        const theadProps = child.props as { children: React.ReactNode }
        Children.forEach(theadProps.children, (tr) => {
          if (React.isValidElement(tr) && tr.type === 'tr') {
            const trProps = tr.props as { children: React.ReactNode }
            Children.forEach(trProps.children, (th) => {
              if (React.isValidElement(th) && (th.type === 'th' || th.type === 'td')) {
                const thProps = th.props as { children: React.ReactNode }
                headers.push(String(thProps.children))
              }
            })
          }
        })
      } else if (child.type === 'tbody') {
        const tbodyProps = child.props as { children: React.ReactNode }
        Children.forEach(tbodyProps.children, (tr) => {
          if (React.isValidElement(tr) && tr.type === 'tr') {
            const row: Record<string, any> = {}
            const trProps = tr.props as { children: React.ReactNode }
            Children.forEach(trProps.children, (td, index) => {
              if (React.isValidElement(td) && td.type === 'td') {
                const tdProps = td.props as { children: React.ReactNode }
                const key = headers[index] || `col${index + 1}`
                row[key] = tdProps.children
              }
            })
            rows.push(row)
          }
        })
      }
    }
  })

  // Use Table as a function component
  return <Table data={rows} />
}

/**
 * Link component
 */
export function A({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <Text>{children}</Text>
  return <Link url={href}>{children}</Link>
}

/**
 * Blockquote component
 */
export function Blockquote({ children }: { children: React.ReactNode }) {
  return (
    <Box borderStyle='round' borderColor='gray' paddingX={1}>
      {children}
    </Box>
  )
}

/**
 * Horizontal rule component
 */
export function Hr() {
  return <Text color='gray'>{'─'.repeat(50)}</Text>
}

/**
 * Default components to provide to MDX
 */
export const defaultComponents = {
  Text,
  Box: PastelBox,
  Image,
  Icon,
  img: Image, // Map HTML img tags to the Image component

  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,

  strong: Strong,
  em: Em,
  del: Del,
  s: Del, // Alias for del

  ul: Ul,
  ol: Ol,
  li: Li,

  code: Code,
  pre: Pre,

  table: TableComponent,

  a: A,

  blockquote: Blockquote,
  hr: Hr,
}
