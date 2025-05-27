import fs from 'node:fs/promises'
import path from 'node:path'
import { findMdxFiles } from './mdx-parser'

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Find index file in a directory
 * Looks for README.md, readme.md, index.md, index.mdx, page.md, page.mdx
 */
export async function findIndexFile(dir: string): Promise<string | null> {
  const possibleFiles = [
    path.join(dir, 'README.md'),
    path.join(dir, 'readme.md'),
    path.join(dir, 'index.md'),
    path.join(dir, 'index.mdx'),
    path.join(dir, 'page.md'),
    path.join(dir, 'page.mdx'),
  ]

  for (const file of possibleFiles) {
    if (await fileExists(file)) {
      return file
    }
  }

  return null
}

/**
 * Find all directories containing index files
 * This is useful for building a navigation structure
 */
export async function findDirectoriesWithIndexFiles(rootDir: string): Promise<string[]> {
  const result: string[] = []

  async function scanDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      const hasIndex = await findIndexFile(dir)
      if (hasIndex) {
        result.push(dir)
      }

      for (const entry of entries) {
        if (
          entry.isDirectory() &&
          !entry.name.startsWith('.') &&
          !entry.name.startsWith('node_modules') &&
          !entry.name.startsWith('dist') &&
          !entry.name.startsWith('build')
        ) {
          await scanDirectory(path.join(dir, entry.name))
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error)
    }
  }

  await scanDirectory(rootDir)
  return result
}

/**
 * Represents a node in the route tree
 */
export interface RouteNode {
  path: string
  name: string
  type: 'file' | 'directory'
  children: RouteNode[]
  indexFile?: string | null
}

/**
 * Build a hierarchical route structure from a list of directories
 * Returns a tree structure representing the routing hierarchy
 */
export async function buildRouteTree(rootDir: string): Promise<RouteNode> {
  const root: RouteNode = {
    path: rootDir,
    name: path.basename(rootDir),
    type: 'directory',
    children: [],
    indexFile: await findIndexFile(rootDir),
  }

  async function buildNode(node: RouteNode) {
    try {
      const entries = await fs.readdir(node.path, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(node.path, entry.name)

        if (
          entry.isDirectory() &&
          !entry.name.startsWith('.') &&
          !entry.name.startsWith('node_modules') &&
          !entry.name.startsWith('dist') &&
          !entry.name.startsWith('build')
        ) {
          const indexFile = await findIndexFile(fullPath)
          const childNode: RouteNode = {
            path: fullPath,
            name: entry.name,
            type: 'directory',
            children: [],
            indexFile,
          }

          if (indexFile || (await fs.readdir(fullPath)).some((file) => file.endsWith('.md') || file.endsWith('.mdx'))) {
            node.children.push(childNode)
            await buildNode(childNode)
          }
        }
      }

      for (const entry of entries) {
        const fullPath = path.join(node.path, entry.name)

        if (
          entry.isFile() &&
          (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) &&
          !['README.md', 'readme.md', 'index.md', 'index.mdx', 'page.md', 'page.mdx'].includes(entry.name)
        ) {
          node.children.push({
            path: fullPath,
            name: entry.name.replace(/\.(md|mdx)$/, ''),
            type: 'file',
            children: [],
          })
        }
      }
    } catch (error) {
      console.error(`Error building route tree for ${node.path}:`, error)
    }
  }

  await buildNode(root)
  return root
}

/**
 * Find a route node by path segments
 */
export function findRouteByPath(root: RouteNode, pathSegments: string[]): RouteNode | null {
  if (pathSegments.length === 0) {
    return root
  }

  const [current, ...rest] = pathSegments
  const child = root.children.find((c) => c.name === current)

  if (!child) {
    return null
  }

  if (rest.length === 0) {
    return child
  }

  return findRouteByPath(child, rest)
}

/**
 * Convert a file path to route path segments
 */
/**
 * Alias for buildRouteTree for better naming in the CLI
 */
export const findRouteTree = buildRouteTree

export function filePathToRouteSegments(rootDir: string, filePath: string): string[] {
  const relativePath = path.relative(rootDir, filePath)
  const segments = relativePath.split(path.sep)

  const lastSegment = segments[segments.length - 1]
  if (['README.md', 'readme.md', 'index.md', 'index.mdx', 'page.md', 'page.mdx'].includes(lastSegment)) {
    segments.pop()
  } else if (lastSegment.endsWith('.md') || lastSegment.endsWith('.mdx')) {
    segments[segments.length - 1] = lastSegment.replace(/\.(md|mdx)$/, '')
  }

  return segments
}
