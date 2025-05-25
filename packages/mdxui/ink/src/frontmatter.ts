import { MdxFrontmatter } from './types.js'

/**
 * Parse frontmatter from MDX content
 */
export function parseFrontmatter(content: string): { frontmatter: MdxFrontmatter; mdxContent: string } {
  // Check if content has frontmatter
  if (!content.startsWith('---')) {
    return {
      frontmatter: {},
      mdxContent: content,
    }
  }

  // Find the end of frontmatter
  const endOfFrontmatter = content.indexOf('---', 3)
  if (endOfFrontmatter === -1) {
    return {
      frontmatter: {},
      mdxContent: content,
    }
  }

  // Extract frontmatter content
  const frontmatterContent = content.substring(3, endOfFrontmatter).trim()

  // Parse frontmatter YAML
  const frontmatter = parseFrontmatterYaml(frontmatterContent)

  // Extract MDX content after frontmatter
  const mdxContent = content.substring(endOfFrontmatter + 3).trim()

  return {
    frontmatter,
    mdxContent,
  }
}

/**
 * Parse YAML frontmatter content
 * This is a simplified implementation - in a real app, you'd want to use
 * a proper YAML parser like js-yaml
 */
function parseFrontmatterYaml(yaml: string): MdxFrontmatter {
  const frontmatter: MdxFrontmatter = {}

  const lines = yaml.split('\n')

  let currentKey: string | null = null
  let currentIndent = 0

  for (const line of lines) {
    const trimmedLine = line.trimEnd()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    const indent = line.length - line.trimStart().length

    if (indent === 0) {
      // Top-level key
      const colonIndex = trimmedLine.indexOf(':')
      if (colonIndex !== -1) {
        const key = trimmedLine.substring(0, colonIndex).trim()
        const value = trimmedLine.substring(colonIndex + 1).trim()

        if (value) {
          frontmatter[key] = parseValue(value)
        } else {
          frontmatter[key] = {}
          currentKey = key
          currentIndent = indent
        }
      }
    } else if (currentKey && indent > currentIndent) {
      // Nested key under current key
      const colonIndex = trimmedLine.indexOf(':')
      if (colonIndex !== -1) {
        const key = trimmedLine.substring(0, colonIndex).trim()
        const value = trimmedLine.substring(colonIndex + 1).trim()

        if (!frontmatter[currentKey]) {
          frontmatter[currentKey] = {}
        }

        if (typeof frontmatter[currentKey] === 'object') {
          ;(frontmatter[currentKey] as Record<string, any>)[key] = parseValue(value)
        }
      }
    }
  }

  return frontmatter
}

/**
 * Parse a YAML value
 */
function parseValue(value: string): any {
  if (/^-?\d+$/.test(value)) return parseInt(value, 10)
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value)

  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null

  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.substring(1, value.length - 1)
  }

  return value
}
