import { build as veliteBuild, type Options } from 'velite'
import { promises as fs } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileMdx } from './bundler.js'
import { parseFrontmatter } from './parser.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface BuildOptions {
  sourceDir: string
  outputDir: string
  configFile?: string
  watch?: boolean
  bundle?: boolean
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {}
}

export async function build(options: BuildOptions): Promise<void> {
  const { sourceDir, outputDir, configFile, watch = false, bundle = false } = options

  await ensureDir(outputDir)
  try {
    let tempConfigFile: string | undefined = configFile
    if (!configFile) {
      const isSchemaOrAiFolder = (process.cwd().endsWith('/schema') || process.cwd().endsWith('/ai')) && !process.cwd().includes('/node_modules/')
      
      try {
        tempConfigFile = join(process.cwd(), '.velite.temp.js')
        
        let pattern = `${sourceDir}/**/*.{md,mdx}`
        let schemaFn = `(s) => ({\n  title: s.string(),\n  description: s.string().optional(),\n  raw: s.mdx(),\n  code: s.mdx({ mdxOptions: { jsx: true, format: 'mdx' } })\n})`
        
        // Special handling for schema and ai folders
        if (isSchemaOrAiFolder) {
          console.log('mdxld: Using special configuration for schema/ai folder')
          pattern = '*.mdx' // Only process .mdx files in the root of the schema folder
          schemaFn = `(s) => ({\n  $id: s.string().optional(),\n  $type: s.string().optional(),\n  label: s.string().optional(),\n  'rdfs:comment': s.string().optional(),\n  'rdfs:label': s.string().optional(),\n  'rdfs:subClassOf': s.json().optional(),\n  'schema:isPartOf': s.json().optional(),\n  'schema:source': s.json().optional(),\n  raw: s.mdx(),\n  code: s.mdx({ mdxOptions: { jsx: true, format: 'mdx' } })\n})`
        }
        
        const configContent = `export default {\n  root: ${JSON.stringify(process.cwd())},\n  collections: {\n    mdx: {\n      name: 'mdx',\n      pattern: '${pattern}',\n      schema: ${schemaFn}\n    }\n  },\n  output: { data: '${outputDir}' }\n}`
        await fs.writeFile(tempConfigFile, configContent, 'utf-8')
      } catch (err) {
        console.warn('mdxld: Error creating temporary config file:', err)
        tempConfigFile = join(process.cwd(), '.velite.temp.js')
        const pattern = `${sourceDir}/**/*.{md,mdx}`
        const schemaFn = `(s) => ({\n  title: s.string(),\n  description: s.string().optional(),\n  raw: s.mdx(),\n  code: s.mdx({ mdxOptions: { jsx: true, format: 'mdx' } })\n})`
        const configContent = `export default {\n  root: ${JSON.stringify(process.cwd())},\n  collections: {\n    mdx: {\n      name: 'mdx',\n      pattern: '${pattern}',\n      schema: ${schemaFn}\n    }\n  },\n  output: { data: '${outputDir}' }\n}`
        await fs.writeFile(tempConfigFile, configContent, 'utf-8')
      }
    }

    const buildOptions: Options = {
      config: tempConfigFile,
      watch: watch,
      clean: true,
    }

    let result;
    try {
      result = await veliteBuild(buildOptions)
      console.log('mdxld: Velite build successful')
    } catch (error) {
      console.error('mdxld: Velite build error details:', error)
      
      if (error && typeof error === 'object') {
        if ('stack' in error && error.stack) {
          console.error('mdxld: Error stack:', error.stack)
        }
        
        if ('cause' in error && error.cause) {
          console.error('mdxld: Error cause:', error.cause)
        }
      }
      
      const errorString = String(error)
      if (errorString.includes('Cannot read properties of undefined (reading \'errorMap\')')) {
        console.warn('mdxld: Encountered known Velite errorMap issue, continuing with build...')
        result = { files: [] }
      } else {
        throw error
      }
    }

    const indexDtsPath = join(outputDir, 'index.d.ts')
    try {
      const dtsContent = await fs.readFile(indexDtsPath, 'utf-8')
      const fixedDtsContent = dtsContent.replace(
        `import type __vc from '../.velite.temp.js'`,
        `import type { collections } from 'mdxld'`
      ).replace(
        `type Collections = typeof __vc.collections`,
        `type Collections = typeof collections`
      )
      await fs.writeFile(indexDtsPath, fixedDtsContent, 'utf-8')
      console.log('mdxld: Fixed type definitions import path')
    } catch (err) {
      console.warn('mdxld: Failed to fix type definitions:', err)
    }

    if (bundle && result) {
      console.log('mdxld: Bundling MDX files with esbuild...')
      const files = Array.isArray(result.files) ? result.files : []

      for (const file of files) {
        try {
          const mdxCode = file.code
          const bundledCode = await compileMdx(mdxCode)

          const outputPath = join(outputDir, file.path.replace(/\.(md|mdx)$/, '.js'))
          await ensureDir(dirname(outputPath))
          await fs.writeFile(outputPath, bundledCode, 'utf-8')

          console.log(`mdxld: Bundled ${file.path} to ${outputPath}`)
        } catch (error) {
          console.error(`mdxld: Error bundling ${file.path}:`, error)
        }
      }
    }

    if (!configFile && tempConfigFile) {
      try {
        await fs.unlink(tempConfigFile)
      } catch (err) {
        console.warn('mdxld: Failed to clean up temporary config file:', err)
      }
    }
  } catch (error) {
    console.error('mdxld: Velite build error details:', error)
    
    if (error && typeof error === 'object') {
      if ('stack' in error && error.stack) {
        console.error('mdxld: Error stack:', error.stack)
      }
      
      if ('cause' in error && error.cause) {
        console.error('mdxld: Error cause:', error.cause)
      }
    }
    
    throw error
  }
}
