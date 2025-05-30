import { z } from 'zod'
import React from 'react'

export interface MdxPastelInkOptions {
  /**
   * Path to the MDX file
   */
  mdxPath: string

  /**
   * Additional components to provide to MDX
   */
  components?: Record<string, React.ComponentType<any>>

  /**
   * Additional data to provide to the MDX scope
   */
  scope?: Record<string, any>
}

export interface MdxFrontmatter {
  /**
   * Command name
   */
  command?: string

  /**
   * Command description
   */
  description?: string

  /**
   * Input schema definition
   */
  input?: Record<string, string>

  /**
   * Output schema definition
   */
  output?: Record<string, string>

  /**
   * Any additional frontmatter properties
   */
  [key: string]: any
}

/**
 * Extended frontmatter interface for workflow-based MDX files
 */
export interface WorkflowFrontmatter extends MdxFrontmatter {
  workflow?: {
    id: string
    name: string
    description?: string
    steps: Array<{
      id: string
      name: string
      description?: string
      input?: Record<string, string>
      output: Record<string, string>
    }>
  }
}

export interface ParsedMdxDocument {
  /**
   * Parsed frontmatter
   */
  frontmatter: MdxFrontmatter

  /**
   * MDX content
   */
  content: string

  /**
   * Zod schema for input validation
   */
  inputSchema?: z.ZodObject<any>

  /**
   * Zod schema for output validation
   */
  outputSchema?: z.ZodObject<any>
}
