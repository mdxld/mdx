import { build as veliteBuild, type Options } from 'velite'
import { promises as fs } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileMdx } from './bundler.js'
import { parseFrontmatter } from './parser.js'
import { parseTaskList } from './task-list.js'

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

async function validateMdxFiles(directoryPath: string): Promise<{ valid: boolean; invalidFiles: string[] }> {
  const result: { valid: boolean; invalidFiles: string[] } = { valid: true, invalidFiles: [] };
  try {
    const allFiles: string[] = [];
    
    async function scanDir(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          
          if (entry.name === 'node_modules') continue;
          
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
            const relativePath = fullPath.substring(directoryPath.length + 1);
            allFiles.push(relativePath);
          }
        }
      } catch (error) {
        console.warn(`mdxld: Error scanning directory ${dir}:`, error);
      }
    }
    
    await scanDir(directoryPath);
    
    console.log(`mdxld: Validating ${allFiles.length} MDX files in ${directoryPath}`);
    
    for (const file of allFiles) {
      const filePath = join(directoryPath, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { error } = parseFrontmatter(content);
        if (error) {
          result.valid = false;
          result.invalidFiles.push(`${file} - ${error}`);
        }
      } catch (error) {
        console.warn(`mdxld: Error reading or parsing file ${file}:`, error);
        result.valid = false;
        result.invalidFiles.push(`${file} - ${error}`);
      }
    }
  } catch (error) {
    console.warn('mdxld: Error validating MDX files:', error);
  }
  return result;
}

export async function build(options: BuildOptions): Promise<void> {
  const { sourceDir, outputDir, configFile, watch = false, bundle = false } = options

  await ensureDir(outputDir)
  
  console.log('mdxld: Validating MDX files in', sourceDir);
  const validationResult = await validateMdxFiles(sourceDir);
  if (!validationResult.valid) {
    console.warn('mdxld: Found invalid MDX files:');
    validationResult.invalidFiles.forEach(file => console.warn(`- ${file}`));
    console.warn('mdxld: Continuing build process, but these files may cause issues...');
  }
  try {
    let tempConfigFile: string | undefined = configFile
    if (!configFile) {
      const isSchemaOrAiFolder = (process.cwd().endsWith('/schema') || process.cwd().endsWith('/ai')) && !process.cwd().includes('/node_modules/')
      
      try {
        tempConfigFile = join(process.cwd(), '.velite.temp.js')
        
        let pattern = `${sourceDir}/**/*.{md,mdx}|${sourceDir}/**/README.md|${sourceDir}/**/TODO.md|${sourceDir}/**/ROADMAP.md`
        let schemaFn = `(s) => ({\n  title: s.string(),\n  description: s.string().optional(),\n  raw: s.mdx(),\n  code: s.mdx({ mdxOptions: { jsx: true, format: 'mdx' } }),\n  tasks: s.json().optional()\n})`
        
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
        const pattern = `${sourceDir}/**/*.{md,mdx}|${sourceDir}/**/README.md|${sourceDir}/**/TODO.md|${sourceDir}/**/ROADMAP.md`
        const schemaFn = `(s) => ({\n  title: s.string(),\n  description: s.string().optional(),\n  raw: s.mdx(),\n  code: s.mdx({ mdxOptions: { jsx: true, format: 'mdx' } }),\n  tasks: s.json().optional()\n})`
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
      console.log('mdxld: Starting Velite build with pattern:', buildOptions.config);
      
      
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
        console.warn('mdxld: Check validation results above for potential problematic files')
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

          const taskListResult = parseTaskList(file.raw || '')
          
          if (taskListResult.tasks.length > 0) {
            const metadataPath = join(outputDir, file.path.replace(/\.(md|mdx)$/, '.metadata.json'))
            await ensureDir(dirname(metadataPath))
            await fs.writeFile(metadataPath, JSON.stringify({ tasks: taskListResult.tasks }, null, 2), 'utf-8')
            console.log(`mdxld: Extracted ${taskListResult.tasks.length} tasks from ${file.path}`)
          }

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
