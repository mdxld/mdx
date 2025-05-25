import React, { useState, useEffect, useMemo } from 'react';
import { Text as InkText, Box } from 'ink';
import type { TextProps, BoxProps } from 'ink';
import chalk from 'chalk';
import * as ReactDOMServer from 'react-dom/server';
import { IconName, getIconLibrary, ICON_LIBRARIES } from './icons';

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
          .then(response => response.text())
          .then(svgContent => {
            setAsciiArt('') // Clear any existing ASCII art
            const options: any = {
              fit: 'box',
              width,
              height: height || width,
              format: 'string',
              color: false,
            }
            
            const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
            
            return import('asciify-image')
              .then((asciifyModule) => {
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
          .catch(err => {
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
          .catch(err => {
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
        setError(`Failed to convert to ASCII: ${err?.message || String(err)}`)
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

/**
 * Default components to provide to MDX
 */
export const defaultComponents = {
  Text,
  Box: PastelBox,
  Image,
  Icon,
  img: Image, // Map HTML img tags to the Image component
}
