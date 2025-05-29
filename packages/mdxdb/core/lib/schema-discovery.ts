import { promises as fs } from 'fs'
import path from 'path'
import { parse } from 'yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'

/**
 * Schema definition with collection name and schema
 */
export interface SchemaDefinition {
  collectionName: string
  schema: any
  source: 'frontmatter' | 'heading'
}

/**
 * Discover schema definitions from .db folder
 * @param dbFolderPath Path to .db folder
 * @returns Array of schema definitions
 */
/**
 * Interface for heading-YAML pairs
 */
export interface HeadingYamlPair {
  headingText: string
  headingLevel: number
  yamlContent: string
}

/**
 * Interface for frontmatter parsing result
 */
export interface ParseFrontmatterResult {
  frontmatter: Record<string, any> | null
  error?: string
}

/**
 * Parse frontmatter from MDX content
 * @param mdxContent MDX content to parse
 * @returns Frontmatter object or null with optional error
 */
function parseFrontmatter(mdxContent: string): ParseFrontmatterResult {
  const frontmatterRegex = /^\s*---([\s\S]*?)---/
  const match = mdxContent.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {} }
  }

  const yamlContent = match[1]

  try {
    const frontmatter = parseYaml(yamlContent)
    if (frontmatter === null || frontmatter === undefined) {
      return { frontmatter: {} }
    }
    if (typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
      return {
        frontmatter: null,
        error: 'Invalid Frontmatter: Frontmatter must be a YAML object (key-value pairs).',
      }
    }
    return { frontmatter: frontmatter as Record<string, any> }
  } catch (e: any) {
    return { frontmatter: null, error: `YAML Parsing Error: ${e.message}` }
  }
}

/**
 * YAML parser using the yaml package
 * @param yamlContent YAML content to parse
 * @returns Parsed YAML object
 */
function parseYaml(yamlContent: string): any {
  try {
    const result = parse(yamlContent)
    return result || null
  } catch (e: any) {
    console.warn(`Error parsing YAML: ${e.message}`)
    return null
  }
}

/**
 * Extract YAML codeblocks associated with headings from MDX content using unified/remark
 * @param mdxContent MDX content to parse
 * @returns Array of heading-YAML pairs for schema definitions
 */
function parseHeadingsWithYaml(mdxContent: string): HeadingYamlPair[] {
  try {
    const processor = unified().use(remarkParse).use(remarkMdx)
    const tree = processor.parse(mdxContent)

    const results: HeadingYamlPair[] = []
    let currentHeading: { text: string; level: number } | null = null

    visit(tree, ['heading', 'code'], (node: any) => {
      if (node.type === 'heading') {
        currentHeading = {
          text: node.children?.map((child: any) => child.value || '').join('') || '',
          level: node.depth,
        }
      } else if (node.type === 'code' && node.lang === 'yaml' && currentHeading) {
        results.push({
          headingText: currentHeading.text,
          headingLevel: currentHeading.level,
          yamlContent: node.value,
        })
      }
    })

    return results
  } catch (e: any) {
    console.error(`Error parsing headings with YAML: ${e.message}`)
    return []
  }
}

/**
 * Create schema from YAML description with type annotations
 * @param yamlDescription YAML object with descriptions as values
 * @returns Schema object
 */
function createSchemaFromDescription(yamlDescription: Record<string, any>): any {
  const schemaObj: Record<string, any> = {}

  Object.entries(yamlDescription).forEach(([key, description]) => {
    if (typeof description !== 'string') {
      schemaObj[key] = { type: 'string', description: String(description) }
      return
    }

    const typeAnnotationMatch = description.match(/\(([^)]+)\)$/)
    const enumMatch = description.match(/\(([^)]*\|[^)]*)\)$/) || description.match(/([^(]*\|[^(]*)$/)

    let baseDescription = description
    let type = 'string'

    if (enumMatch) {
      const enumValues = enumMatch[1]
        .split('|')
        .map((v) => v.trim())
        .filter(Boolean)
      if (enumValues.length >= 1) {
        type = 'enum'
        baseDescription = description
          .replace(/\([^)]*\|[^)]*\)$/, '')
          .replace(/[^(]*\|[^(]*$/, '')
          .trim()
        schemaObj[key] = {
          type,
          description: baseDescription,
          enum: enumValues,
        }
        return
      }
    } else if (typeAnnotationMatch) {
      const typeAnnotation = typeAnnotationMatch[1].toLowerCase()
      baseDescription = description.replace(/\([^)]*\)$/, '').trim()

      switch (typeAnnotation) {
        case 'bool':
        case 'boolean':
          type = 'boolean'
          break
        case 'number':
        case 'num':
          type = 'number'
          break
        case 'date':
        case 'datetime':
          type = 'date'
          break
        case 'array':
          type = 'array'
          break
        case 'object':
          type = 'object'
          break
      }
    }

    schemaObj[key] = { type, description: baseDescription }
  })

  return schemaObj
}

/**
 * Discover schema definitions from .db folder
 * @param dbFolderPath Path to .db folder
 * @returns Array of schema definitions
 */
export async function discoverSchemas(dbFolderPath: string): Promise<SchemaDefinition[]> {
  const schemaDefinitions: SchemaDefinition[] = []

  try {
    await fs.access(dbFolderPath)
  } catch {
    return schemaDefinitions
  }

  try {
    // Find all MDX files in the .db folder
    const files = await fs.readdir(dbFolderPath, { recursive: true })
    const mdxFiles = files.filter((file) => typeof file === 'string' && (file.endsWith('.md') || file.endsWith('.mdx')))

    for (const file of mdxFiles) {
      const filePath = path.join(dbFolderPath, file as string)
      const content = await fs.readFile(filePath, 'utf-8')

      const frontmatterResult = parseFrontmatter(content)
      if (frontmatterResult.frontmatter && frontmatterResult.frontmatter.collections) {
        Object.entries(frontmatterResult.frontmatter.collections).forEach(([name, yamlSchema]) => {
          try {
            const schema = createSchemaFromDescription(yamlSchema as Record<string, any>)
            schemaDefinitions.push({
              collectionName: name,
              schema,
              source: 'frontmatter',
            })
          } catch (error) {
            console.warn(`Failed to parse frontmatter schema for collection ${name}:`, error)
          }
        })
      }

      const headingSchemas = parseHeadingsWithYaml(content)
      for (const headingSchema of headingSchemas) {
        try {
          const yamlData = parseYaml(headingSchema.yamlContent)
          // Skip if the parsed YAML is empty (likely due to parsing error)
          if (!yamlData || Object.keys(yamlData).length === 0) {
            continue
          }
          const schema = createSchemaFromDescription(yamlData)
          schemaDefinitions.push({
            collectionName: headingSchema.headingText.toLowerCase().replace(/\s+/g, '-'),
            schema,
            source: 'heading',
          })
        } catch (error) {
          console.warn(`Failed to parse heading schema for ${headingSchema.headingText}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Error discovering schemas:', error)
  }

  return schemaDefinitions
}
