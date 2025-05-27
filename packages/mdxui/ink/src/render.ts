#!/usr/bin/env node
import React from 'react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { WorkflowFrontmatter, MdxPastelInkOptions } from './types'
import { createWorkflowFromFrontmatter } from './workflow'

import { compile, evaluate, type UseMdxComponents } from '@mdx-js/mdx'
import { VFile } from 'vfile'
import * as runtime from 'react/jsx-runtime'
import { parseFrontmatter } from './frontmatter'
import { defaultComponents } from './components'
import { landingPageComponents } from './LandingPage'
import { loadMdxComponents, type MDXComponents } from './component-loader'

/**
 * Compile MDX content to a React component
 */
export async function compileMdx(
  mdxContent: string,
  scope: Record<string, any> = {},
  options: { remarkPlugins?: any[]; rehypePlugins?: any[]; components?: Record<string, React.ComponentType<any>> } = {},
): Promise<React.ComponentType<any>> {
  try {
    // Parse frontmatter
    const { frontmatter, mdxContent: contentWithoutFrontmatter } = parseFrontmatter(mdxContent)

    const result = await compile(new VFile(contentWithoutFrontmatter), {
      jsx: true,
      jsxImportSource: 'react',
      remarkPlugins: options.remarkPlugins,
      rehypePlugins: options.rehypePlugins,
    })

    const components = {
      ...defaultComponents,
      ...landingPageComponents,
      ...options.components,
    }

    // Use the correct type for useMDXComponents
    const useMDXComponents: UseMdxComponents = () => components as MDXComponents
    const { default: Component } = await evaluate(result, {
      ...runtime,
      ...scope,
      useMDXComponents,
    })

    return Component
  } catch (error) {
    console.error('Error compiling MDX:', error)
    return () => null
  }
}

/**
 * Render MDX content in a CLI app
 * @param mdxContentOrPath - Either MDX content as a string or a path to an MDX file
 * @param options - Options for rendering
 * @returns Object containing Component, frontmatter, and optional workflow
 */
export async function renderMdxCli(
  mdxContentOrPath: string,
  options: Partial<MdxPastelInkOptions & { executeCode?: boolean }> = {},
): Promise<{
  Component: React.ComponentType<any>
  frontmatter: Record<string, any>
  workflow?: ReturnType<typeof createWorkflowFromFrontmatter>
}> {
  let mdxContent: string
  try {
    if (options.mdxPath || (mdxContentOrPath.includes('/') && !mdxContentOrPath.includes('\n'))) {
      const filePath = options.mdxPath || mdxContentOrPath
      const resolvedPath = resolve(process.cwd(), filePath)

      try {
        mdxContent = readFileSync(resolvedPath, 'utf8')
      } catch (error) {
        console.error(`Error reading MDX file: ${resolvedPath}`, error)
        throw error
      }
    } else {
      mdxContent = mdxContentOrPath
    }

    // Parse frontmatter
    const { frontmatter, mdxContent: contentWithoutFrontmatter } = parseFrontmatter(mdxContent)

    const loadedComponents = await loadMdxComponents()
    const Component = await compileMdx(contentWithoutFrontmatter, options.scope, {
      remarkPlugins: [],
      rehypePlugins: [],
      components: loadedComponents,
    })

    // Check for workflow in frontmatter
    if ((frontmatter as WorkflowFrontmatter).workflow || (frontmatter as WorkflowFrontmatter).steps || (frontmatter as WorkflowFrontmatter).screens) {
      const workflow = createWorkflowFromFrontmatter(frontmatter as WorkflowFrontmatter)
      return { Component, frontmatter, workflow }
    }

    return { Component, frontmatter }
  } catch (error) {
    console.error('Error processing MDX:', error)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: node render.js <mdx-file>')
    process.exit(1)
  }

  try {
    await renderMdxCli(args[0])
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
