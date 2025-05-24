import https from 'https'
import fs from 'fs/promises'
import path from 'path'

/**
 * Expands URI prefixes to their full URI form
 */
function expandUriPrefix(uri: string): string {
  if (typeof uri !== 'string') return uri
  const prefixMap: Record<string, string> = {
    'schema:': 'https://schema.org/',
    'rdf:': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs:': 'http://www.w3.org/2000/01/rdf-schema#',
  }
  for (const [prefix, expansion] of Object.entries(prefixMap)) {
    if (uri.startsWith(prefix)) {
      return uri.replace(prefix, expansion)
    }
  }
  return uri
}

/**
 * Flattens object-wrapped URI references to simple strings
 */
function flattenUriObject(obj: any): string {
  if (typeof obj === 'string') return expandUriPrefix(obj)
  if (obj && (obj['$id'] || obj['@id'])) {
    return expandUriPrefix(obj['$id'] || obj['@id'])
  }
  return obj
}

/**
 * Fetches Schema.org JSON-LD data from the latest version
 */
async function fetchSchemaOrgJsonLd(): Promise<any> {
  const url = 'https://schema.org/version/latest/schemaorg-current-https.jsonld'

  return new Promise<any>((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          const location = response.headers['location'] || response.headers['content-location']

          if (location) {
            console.log(`Handling redirect to ${location}...`)
            https.get(location, handleResponse).on('error', reject)
            return
          }

          reject(new Error(`Failed to fetch Schema.org data: ${response.statusCode} ${response.statusMessage}`))
          return
        }

        handleResponse(response)
      })
      .on('error', reject)

    function handleResponse(response: any) {
      const data: string[] = []

      response.on('data', (chunk: Buffer) => {
        data.push(chunk.toString('utf-8'))
      })

      response.on('end', () => {
        try {
          const jsonld = JSON.parse(data.join(''))
          resolve(jsonld)
        } catch (error) {
          reject(new Error(`Failed to parse Schema.org data: ${error}`))
        }
      })

      response.on('error', (error: Error) => {
        reject(error)
      })
    }
  })
}

/**
 * Extracts all Things (classes and properties) from the JSON-LD data
 */
function parseThings(jsonld: any): any[] {
  const things: any[] = []

  const graph = jsonld['@graph'] || []

  console.log('Looking for Schema.org classes and properties in the graph...')

  for (const item of graph) {
    const isClass =
      (typeof item['@type'] === 'string' && (item['@type'] === 'rdfs:Class' || item['@type'].includes('http://www.w3.org/2000/01/rdf-schema#Class'))) ||
      (Array.isArray(item['@type']) &&
        (item['@type'].includes('rdfs:Class') || item['@type'].some((t: string) => t.includes('http://www.w3.org/2000/01/rdf-schema#Class'))))

    const isProperty =
      (typeof item['@type'] === 'string' &&
        (item['@type'] === 'rdf:Property' || item['@type'].includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'))) ||
      (Array.isArray(item['@type']) &&
        (item['@type'].includes('rdf:Property') || item['@type'].some((t: string) => t.includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'))))

    const isSchemaOrg = item['@id']?.startsWith('schema:') || item['@id']?.startsWith('https://schema.org/') || item['@id']?.startsWith('http://schema.org/')

    if ((isClass || isProperty) && isSchemaOrg) {
      console.log(`Found Schema.org ${isClass ? 'class' : 'property'}: ${item['@id']}`)

      const convertedThing: any = {}
      for (const [key, value] of Object.entries(item)) {
        if (key.startsWith('@')) {
          if (key === '@id' || key === '@type') {
            convertedThing[`$${key.substring(1)}`] = expandUriPrefix(value as string)
          } else {
            convertedThing[`$${key.substring(1)}`] = value
          }
        } else {
          if (Array.isArray(value)) {
            convertedThing[key] = value.map((item) => {
              return typeof item === 'object' ? flattenUriObject(item) : expandUriPrefix(item)
            })
          } else if (typeof value === 'object' && value !== null) {
            convertedThing[key] = flattenUriObject(value)
          } else {
            convertedThing[key] = expandUriPrefix(value as string)
          }
        }
      }
      things.push(convertedThing)
    }
  }

  return things
}

/**
 * Formats a URI reference as a proper markdown link
 */
function formatReference(uri: string): string {
  if (typeof uri !== 'string') {
    return 'Unknown'
  }

  const expandedUri = expandUriPrefix(uri)
  let label = expandedUri.split('/').pop() || expandedUri

  label = label.replace(/^(rdfs:|schema:)/, '')

  return `[${label}](${expandedUri})`
}

/**
 * Categorizes properties into direct and inherited properties
 */
function categorizeProperties(properties: any[], thingId: string): { direct: any[]; inherited: any[] } {
  const direct = properties.filter((prop) => {
    if (!prop.domainIncludes) return false

    const domains = Array.isArray(prop.domainIncludes) ? prop.domainIncludes : [prop.domainIncludes]

    return domains.some((domain: any) => (domain['$id'] || domain) === thingId)
  })

  const inherited = properties.filter((prop) => !direct.includes(prop))

  return { direct, inherited }
}

/**
 * Resolves the inheritance chain to get all properties for a Thing
 */
function resolveInheritedProperties(thing: any, allThings: any[]): any[] {
  const properties: any[] = []
  const visited = new Set<string>()

  function collectProperties(thingId: string) {
    if (visited.has(thingId)) return
    visited.add(thingId)

    const directProperties = allThings.filter((item) => {
      // Check both domainIncludes and schema:domainIncludes
      const domainIncludes = item.domainIncludes || item['schema:domainIncludes']

      return (
        item['$type']?.includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property') &&
        domainIncludes &&
        (Array.isArray(domainIncludes)
          ? domainIncludes.some((domain: any) => expandUriPrefix(flattenUriObject(domain)) === expandUriPrefix(thingId))
          : expandUriPrefix(flattenUriObject(domainIncludes)) === expandUriPrefix(thingId))
      )
    })

    properties.push(...directProperties)

    const currentThing = allThings.find((t) => expandUriPrefix(t['$id'] as string) === expandUriPrefix(thingId))
    if (currentThing?.subClassOf) {
      const parentIds = Array.isArray(currentThing.subClassOf)
        ? currentThing.subClassOf.map((parent: any) => expandUriPrefix(flattenUriObject(parent)))
        : [expandUriPrefix(flattenUriObject(currentThing.subClassOf))]

      for (const parentId of parentIds) {
        collectProperties(parentId)
      }
    }
  }

  collectProperties(thing['$id'])

  const uniqueProperties = Array.from(new Map(properties.map((p) => [p['$id'], p])).values())

  return uniqueProperties.sort((a, b) => {
    const nameA = a.label || a.name || a['$id']?.split('/').pop() || ''
    const nameB = b.label || b.name || b['$id']?.split('/').pop() || ''
    return nameA.localeCompare(nameB)
  })
}

/**
 * Generates MDX content with enhanced frontmatter and markdown tables
 */
function generateMdxContent(thing: any, properties: any[], isProperty: boolean = false): string {
  const label = thing.label || thing.name || thing['$id']?.split('/').pop() || 'Unknown'
  const comment = thing['rdfs:comment'] || thing.comment || thing.description || ''
  const trimmedComment = typeof comment === 'string' ? comment.trim() : comment

  let frontmatter = '---\n'
  frontmatter += `$id: ${expandUriPrefix(thing['$id'] as string)}\n`
  frontmatter += `$type: ${expandUriPrefix(thing['$type'] as string)}\n`
  frontmatter += `label: ${label}\n`

  if (trimmedComment) {
    if (typeof trimmedComment === 'string') {
      frontmatter += `comment: |\n${trimmedComment
        .split('\n')
        .map((line: string) => `  ${line.trim()}`)
        .join('\n')}\n`
    } else {
      frontmatter += `comment: ${JSON.stringify(trimmedComment)}\n`
    }
  }

  if (isProperty) {
    if (thing.domainIncludes) {
      const domains = Array.isArray(thing.domainIncludes) ? thing.domainIncludes : [thing.domainIncludes]

      domains.forEach((domain: any, index: number) => {
        const domainId = expandUriPrefix(flattenUriObject(domain))
        frontmatter += `domain${index > 0 ? index + 1 : ''}: ${domainId}\n`
      })
    }

    if (thing.rangeIncludes) {
      const ranges = Array.isArray(thing.rangeIncludes) ? thing.rangeIncludes : [thing.rangeIncludes]

      ranges.forEach((range: any, index: number) => {
        const rangeId = expandUriPrefix(flattenUriObject(range))
        frontmatter += `range${index > 0 ? index + 1 : ''}: ${rangeId}\n`
      })
    }
  } else if (thing.subClassOf) {
    const subClassOf = Array.isArray(thing.subClassOf)
      ? thing.subClassOf.map((sc: any) => expandUriPrefix(flattenUriObject(sc))).join(', ')
      : expandUriPrefix(flattenUriObject(thing.subClassOf))
    frontmatter += `subClassOf: ${subClassOf}\n`
  }

  const metadataKeys = Object.keys(thing).filter(
    (key) => !['$id', '$type', 'label', 'comment', 'rdfs:comment', 'description', 'subClassOf', 'domainIncludes', 'rangeIncludes'].includes(key),
  )

  for (const key of metadataKeys) {
    const value = thing[key]
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          frontmatter += `${key}: ${JSON.stringify(value.map((item) => (typeof item === 'object' ? flattenUriObject(item) : expandUriPrefix(item as string))))}\n`
        } else {
          frontmatter += `${key}: ${JSON.stringify(flattenUriObject(value))}\n`
        }
      } else {
        if (typeof value === 'string' && value.includes('\n')) {
          frontmatter += `${key}: |\n${(value as string)
            .trim()
            .split('\n')
            .map((line: string) => `  ${line.trim()}`)
            .join('\n')}\n`
        } else {
          frontmatter += `${key}: ${JSON.stringify(expandUriPrefix(typeof value === 'string' ? value.trim() : value))}\n`
        }
      }
    }
  }

  frontmatter += '---\n\n'

  let markdown = `# ${label}\n\n`

  if (trimmedComment) {
    if (typeof trimmedComment === 'string') {
      markdown += `${trimmedComment}\n\n`
    } else {
      markdown += `${JSON.stringify(trimmedComment)}\n\n`
    }
  }

  if (!isProperty && properties.length > 0) {
    const directProperties = properties.filter((prop) => {
      if (!prop.domainIncludes) return false

      const domains = Array.isArray(prop.domainIncludes) ? prop.domainIncludes : [prop.domainIncludes]

      return domains.some((domain: any) => expandUriPrefix(flattenUriObject(domain)) === expandUriPrefix(thing['$id'] as string))
    })

    const inheritedProperties = properties.filter((prop) => !directProperties.includes(prop))

    if (directProperties.length > 0) {
      markdown += '## Properties\n\n'
      markdown += '| Property | Expected Type | Description |\n'
      markdown += '| --- | --- | --- |\n'

      for (const property of directProperties) {
        const propName = property.label || property.name || property['$id']?.split('/').pop() || 'Unknown'
        const propLink = formatReference(property['$id'] as string)

        let expectedType = 'Text'
        if (property.rangeIncludes) {
          const ranges = Array.isArray(property.rangeIncludes) ? property.rangeIncludes : [property.rangeIncludes]

          expectedType = ranges
            .map((range: any) => {
              const type = flattenUriObject(range)
              return formatReference(type)
            })
            .join(' or ')
        }

        const description = property.comment || property.description || ''

        markdown += `| ${propLink} | ${expectedType} | ${description} |\n`
      }

      markdown += '\n'
    }

    if (inheritedProperties.length > 0) {
      markdown += '## Inherited Properties\n\n'
      markdown += '| Property | Expected Type | Description |\n'
      markdown += '| --- | --- | --- |\n'

      for (const property of inheritedProperties) {
        const propName = property.label || property.name || property['$id']?.split('/').pop() || 'Unknown'
        const propLink = formatReference(property['$id'] as string)

        let expectedType = 'Text'
        if (property.rangeIncludes) {
          const ranges = Array.isArray(property.rangeIncludes) ? property.rangeIncludes : [property.rangeIncludes]

          expectedType = ranges
            .map((range: any) => {
              const type = flattenUriObject(range)
              return formatReference(type)
            })
            .join(' or ')
        }

        const description = property.comment || property.description || ''

        markdown += `| ${propLink} | ${expectedType} | ${description} |\n`
      }
    }
  }

  return frontmatter + markdown
}

/**
 * Writes the generated MDX files to the appropriate location
 */
async function writeFiles(things: any[], allThings: any[]): Promise<void> {
  const outputDir = path.join(process.cwd(), 'schema.org')
  const propertiesDir = path.join(outputDir, 'properties')

  try {
    await fs.mkdir(outputDir, { recursive: true })
    await fs.mkdir(propertiesDir, { recursive: true })

    console.log(`Writing MDX files to ${outputDir}...`)

    let classCount = 0
    let propertyCount = 0

    for (const thing of things) {
      const name = thing.label || thing.name || thing['$id']?.split('/').pop() || 'Unknown'
      const isProperty = Array.isArray(thing['$type'])
        ? thing['$type'].some((t) => t === 'rdf:Property' || t.includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'))
        : thing['$type'] === 'rdf:Property' || thing['$type']?.includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property')

      // Use different directory for properties
      const dirPath = isProperty ? propertiesDir : outputDir
      const filename = `${name.replace('schema:', '').replace(/[^a-zA-Z0-9]/g, '')}.mdx`
      const filePath = path.join(dirPath, filename)

      let properties: any[] = []

      if (!isProperty) {
        properties = resolveInheritedProperties(thing, allThings)
        // Add debugging for properties
        if (name === 'FinancialIncentive') {
          console.log(`Found ${properties.length} properties for ${name}`)
          if (properties.length === 0) {
            console.log(`No properties found for ${name} with ID ${thing['$id']}`)
            const propertiesWithDomain = allThings.filter(
              (item: any) =>
                item['$type']?.includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property') &&
                item.domainIncludes &&
                ((Array.isArray(item.domainIncludes) &&
                  item.domainIncludes.some((domain: any) => expandUriPrefix(flattenUriObject(domain)) === expandUriPrefix(thing['$id'] as string))) ||
                  (!Array.isArray(item.domainIncludes) && expandUriPrefix(flattenUriObject(item.domainIncludes)) === expandUriPrefix(thing['$id'] as string))),
            )
            console.log(`Direct properties with domain ${thing['$id']}: ${propertiesWithDomain.length}`)
          }
        }
      }

      const content = generateMdxContent(thing, properties, isProperty)

      await fs.writeFile(filePath, content, 'utf-8')

      if (isProperty) {
        propertyCount++
        if (propertyCount % 100 === 0) {
          console.log(`Generated ${propertyCount} property MDX files...`)
        }
      } else {
        classCount++
        if (classCount % 100 === 0) {
          console.log(`Generated ${classCount} class MDX files...`)
        }
      }
    }

    console.log(`Successfully generated ${classCount} class MDX files in ${outputDir}`)
    console.log(`Successfully generated ${propertyCount} property MDX files in ${propertiesDir}`)
  } catch (error) {
    console.error('Error writing MDX files:', error)
    throw error
  }
}

/**
 * Main function to orchestrate the generation process
 */
async function main() {
  try {
    console.log('Fetching Schema.org JSON-LD data...')
    const jsonld = await fetchSchemaOrgJsonLd()

    // Debug the structure of the JSON-LD data
    console.log('JSON-LD structure:', Object.keys(jsonld))
    if (jsonld['@graph']) {
      console.log(`@graph array length: ${jsonld['@graph'].length}`)
      if (jsonld['@graph'].length > 0) {
        console.log('First few items in @graph:', JSON.stringify(jsonld['@graph'].slice(0, 3), null, 2))
      }
    } else {
      console.log('No @graph found in the JSON-LD data. Full data:', JSON.stringify(jsonld, null, 2))
    }

    console.log('Parsing Schema.org types...')
    const allThings = parseThings(jsonld)

    console.log(`Found ${allThings.length} Schema.org types.`)

    // No need to filter things since parseThings now returns both classes and properties

    console.log(`Writing ${allThings.length} Schema.org entities as MDX...`)
    await writeFiles(allThings, allThings)

    console.log('Schema.org MDX generation complete!')
  } catch (error) {
    console.error('Error generating Schema.org MDX files:', error)
    if (error instanceof Error) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main().catch(console.error)
