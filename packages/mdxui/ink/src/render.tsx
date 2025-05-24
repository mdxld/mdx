import fs from 'fs/promises'
import path from 'path'
import React from 'react'
import { render } from 'ink'
import { compile, evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { parseFrontmatter } from './frontmatter'
import { createSchemaFromFrontmatter } from './schema'
import { MdxPastelInkOptions, ParsedMdxDocument } from './types'
import { defaultComponents, wrapSvgComponent } from './components'

/**
 * Parse an MDX file and extract frontmatter, content, and schemas
 */
export async function parseMdxFile(mdxPath: string): Promise<ParsedMdxDocument> {
  const content = await fs.readFile(mdxPath, 'utf-8')

  const { frontmatter, mdxContent } = parseFrontmatter(content)

  const { inputSchema, outputSchema } = createSchemaFromFrontmatter(frontmatter)

  return {
    frontmatter,
    content: mdxContent,
    inputSchema,
    outputSchema,
  }
}

/**
 * Compile MDX content to a React component
 */
export async function compileMdx(mdxContent: string, scope: Record<string, any> = {}): Promise<React.ComponentType<any>> {
  try {
    const compiled = await compile(mdxContent, {
      outputFormat: 'function-body',
      development: true,
      jsx: true,
    })

    const result = await evaluate(compiled, {
      ...runtime,
      ...scope,
    })

    if (result.default) {
      return result.default
    } else {
      return (props) => {
        const MDXContent = result.default || (() => result)
        return React.createElement(MDXContent, props)
      }
    }
  } catch (error) {
    console.error('Error compiling MDX:', error)

    return ({ components }) => {
      const { Text } = components || defaultComponents
      return <Text>Error rendering MDX content. See console for details.</Text>
    }
  }
}

/**
 * Render an MDX file as a CLI app
 */
export async function renderMdxCli(mdxPath: string, options: Partial<MdxPastelInkOptions> = {}) {
  const resolvedPath = path.resolve(mdxPath)

  const parsed = await parseMdxFile(resolvedPath)

  const inputValues = await getInputValues(parsed, options.scope || {})

  if (parsed.inputSchema) {
    parsed.inputSchema.parse(inputValues)
  }

  const combinedScope = {
    ...inputValues,
    ...options.scope,
    ...defaultComponents,
    ...(options.components || {}),
  }

  const Content = await compileMdx(parsed.content, combinedScope)

  // Merge default components with user-provided components
  const mergedComponents = {
    ...defaultComponents,
    ...(options.components || {}),
  }

  const processedComponents = Object.entries(mergedComponents).reduce((acc, [key, component]) => {
    const isSvgComponent = 
      typeof component === 'function' && 
      key.match(/^[A-Z]/) && // Component names start with capital letter
      !defaultComponents.hasOwnProperty(key); // Not one of our built-in components
    
    if (isSvgComponent) {
      acc[key] = wrapSvgComponent(component as React.ComponentType<any>);
    } else {
      acc[key] = component;
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Render the component with input values and processed components
  const { waitUntilExit } = render(<Content components={processedComponents} {...inputValues} />)

  await waitUntilExit()

  return inputValues
}

/**
 * Get input values from command line args or prompt
 * Validates input values against the Zod schema
 */
async function getInputValues(parsed: ParsedMdxDocument, providedValues: Record<string, any> = {}): Promise<Record<string, any>> {
  const inputValues: Record<string, any> = { ...providedValues }

  if (parsed.frontmatter.input) {
    Object.entries(parsed.frontmatter.input).forEach(([key, type]) => {
      if (inputValues[key] === undefined) {
        if (type === 'string') {
          inputValues[key] = `mock-${key}`
        } else if (type === 'number') {
          if (typeof providedValues[key] === 'string' && /^-?\d+(\.\d+)?$/.test(providedValues[key])) {
            inputValues[key] = parseFloat(providedValues[key])
          } else {
            inputValues[key] = 42
          }
        } else if (type?.startsWith('enum[')) {
          const options = type
            .replace('enum[', '')
            .replace(']', '')
            .split(',')
            .map((o) => o.trim())
          inputValues[key] = options[0]
        } else {
          inputValues[key] = `mock-${key}`
        }
      }
    })
  }

  if (parsed.inputSchema) {
    return parsed.inputSchema.parse(inputValues)
  }

  return inputValues
}
