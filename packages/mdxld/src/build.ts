import { build as veliteBuild } from 'velite'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { glob } from 'glob'
import { parse } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultConfigPath = join(__dirname, '../velite.config.ts')

/**
 * Special handling for schema.org directory which has a different structure
 * than regular MDX files and causes issues with Velite
 */
async function buildSchemaOrgFiles(sourceDir: string, outputDir: string) {
  const result: Record<string, any> = {}

  const mdxFiles = await glob('**/*.{md,mdx}', { cwd: sourceDir })

  for (const file of mdxFiles) {
    try {
      const content = fs.readFileSync(join(sourceDir, file), 'utf8')
      const frontmatterRegex = /^\s*---([\s\S]*?)---/
      const match = content.match(frontmatterRegex)

      if (match) {
        const yamlContent = match[1]
        try {
          const frontmatter = parse(yamlContent)
          const id = frontmatter.$id || basename(file, '.mdx')
          result[id] = {
            id: frontmatter.$id,
            type: frontmatter.$type,
            context: frontmatter.$context,
            data: frontmatter,
            $: {
              html: '',
              meta: {},
              mdx: '',
              code: {},
            },
          }
        } catch (e) {
          console.warn(`Warning: Could not parse frontmatter in ${file}`)
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not read file ${file}`)
    }
  }

  return result
}

/**
 * Build MDX files using Velite with the mdxld configuration
 */
export async function build(options: { sourceDir?: string; outputDir?: string; configFile?: string; watch?: boolean; bundle?: boolean }) {
  const { sourceDir = '.', outputDir = '.mdx', configFile = defaultConfigPath, watch = false, bundle = false } = options

  const cwd = process.cwd()
  const absoluteSourceDir = resolve(cwd, sourceDir)
  const absoluteOutputDir = resolve(cwd, outputDir)
  const absoluteConfigFile = resolve(cwd, configFile === defaultConfigPath ? configFile : configFile)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const isSchemaOrg = basename(absoluteSourceDir) === 'schema.org' || absoluteSourceDir.endsWith('/schema.org')

  let result
  if (isSchemaOrg) {
    console.log('mdxld: Detected schema.org directory, using special handling')
    result = await buildSchemaOrgFiles(absoluteSourceDir, absoluteOutputDir)
  } else {
    result = await veliteBuild({
      config: absoluteConfigFile,
      watch,
    })
  }

  const indexJs = `export const mdx = ${JSON.stringify(result, null, 2)};`
  const indexDts = `export declare const mdx: any;`
  const mdxJson = JSON.stringify(result, null, 2)

  fs.writeFileSync(join(outputDir, 'index.js'), indexJs)
  fs.writeFileSync(join(outputDir, 'index.d.ts'), indexDts)
  fs.writeFileSync(join(outputDir, 'mdx.json'), mdxJson)

  return result
}
