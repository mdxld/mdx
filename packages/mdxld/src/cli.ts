#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
import { build } from './build.js'
import { startMcpServer } from './server.js'
import { parseMdx, parseCodeBlocksWithEstree, parseImportsExports } from './parser.js'
import { readFile, readdir } from 'node:fs/promises'
import { extname } from 'node:path'

const program = new Command()

program.version(packageJson.version).description('CLI for working with MDXLD files')

program
  .command('build')
  .description('Build MDX files using Velite')
  .option('-s, --source <directory>', 'Source directory containing MDX files', '.')
  .option('-o, --output <directory>', 'Output directory for processed files', '.mdx')
  .option('-c, --config <file>', 'Path to config file')
  .option('-w, --watch', 'Watch for file changes')
  .option('-b, --bundle', 'Bundle with esbuild')
  .action(async (options) => {
    try {
      const cwd = process.cwd()
      const sourceDir = resolve(cwd, options.source)
      const outputDir = resolve(cwd, options.output)
      const configFile = options.config ? resolve(cwd, options.config) : undefined

      console.log(`mdxld: Starting build process...`)
      console.log(`Source directory: ${sourceDir}`)
      console.log(`Output directory: ${outputDir}`)

      await build({
        sourceDir,
        outputDir,
        configFile,
        watch: options.watch || false,
        bundle: options.bundle || false,
      })

      console.log(`mdxld: Build process complete`)
    } catch (error) {
      console.error('mdxld: Error during build process:')
      if (error instanceof Error) {
        console.error(error.message)
        if (error.stack) {
          console.error(error.stack)
        }
      } else {
        console.error(String(error))
      }
      process.exit(1)
    }
  })

program
  .command('server')
  .description('Start MCP server for mdxld tools')
  .action(async () => {
    try {
      console.log('mdxld: Starting MCP server...')
      await startMcpServer()
    } catch (error) {
      console.error('mdxld: Error starting MCP server:')
      if (error instanceof Error) {
        console.error(error.message)
        if (error.stack) {
          console.error(error.stack)
        }
      } else {
        console.error(String(error))
      }
      process.exit(1)
    }
  })

program
  .command('parse')
  .description('Parse MDX files and output mdast and estree information')
  .argument('[directory]', 'Directory containing MDX files to parse', 'examples/tests')
  .option('-f, --file <file>', 'Specific MDX file to parse')
  .option('--no-mdast', 'Skip mdast parsing')
  .option('--no-code-blocks', 'Skip code block parsing')
  .option('--no-imports-exports', 'Skip imports/exports parsing')
  .action(async (directory, options) => {
    try {
      console.log('mdxld: Starting MDX parsing...')

      const cwd = process.cwd()
      const targetDir = resolve(cwd, directory)

      if (options.file) {
        const filePath = resolve(options.file.startsWith('/') ? options.file : join(targetDir, options.file))
        await processMdxFile(filePath, options)
        return
      }

      const files = await readdir(targetDir)
      const mdxFiles = files.filter((file) => {
        const ext = extname(file).toLowerCase()
        return ext === '.md' || ext === '.mdx'
      })

      if (mdxFiles.length === 0) {
        console.log(`No MDX files found in ${targetDir}`)
        return
      }

      console.log(`Found ${mdxFiles.length} MDX files in ${targetDir}`)

      for (const file of mdxFiles) {
        const filePath = join(targetDir, file)
        await processMdxFile(filePath, options)
      }

      console.log('mdxld: MDX parsing complete')
    } catch (error) {
      console.error('mdxld: Error during MDX parsing:')
      if (error instanceof Error) {
        console.error(error.message)
        if (error.stack) {
          console.error(error.stack)
        }
      } else {
        console.error(String(error))
      }
      process.exit(1)
    }
  })

async function processMdxFile(filePath: string, options: any) {
  try {
    console.log(`\nProcessing file: ${filePath}`)
    const content = await readFile(filePath, 'utf-8')

    if (options.mdast !== false) {
      console.log('\n--- MDX Parsing Results ---')
      const mdxResult = parseMdx(content)

      if (mdxResult.error) {
        console.error(`Error parsing MDX: ${mdxResult.error}`)
      } else {
        console.log('\nFrontmatter:')
        console.log(JSON.stringify(mdxResult.frontmatter, null, 2))

        console.log('\nSimplified MDAST:')
        console.log(JSON.stringify(mdxResult.simplifiedMdast, null, 2))

        console.log('\nFull MDAST available but not printed (too verbose)')
      }
    }

    if (options.codeBlocks !== false) {
      console.log('\n--- Code Blocks with Estree ---')
      const codeBlocks = parseCodeBlocksWithEstree(content)

      if (codeBlocks.length === 0) {
        console.log('No code blocks found')
      } else {
        console.log(`Found ${codeBlocks.length} code blocks:`)

        for (let i = 0; i < codeBlocks.length; i++) {
          const block = codeBlocks[i]
          console.log(`\nCode Block #${i + 1}:`)
          console.log(`Language: ${block.lang || 'none'}`)
          console.log(`Meta: ${block.meta || 'none'}`)

          if (block.error) {
            console.error(`Error: ${block.error}`)
          }

          console.log('Content:')
          console.log(block.value)

          if (block.estree) {
            console.log('Estree AST available but not printed (too verbose)')
          }
        }
      }
    }

    if (options.importsExports !== false) {
      console.log('\n--- Imports and Exports ---')
      const importsExports = parseImportsExports(content)

      if (importsExports.error) {
        console.error(`Error parsing imports/exports: ${importsExports.error}`)
      } else {
        console.log(`Found ${importsExports.imports.length} imports and ${importsExports.exports.length} exports`)

        if (importsExports.imports.length > 0) {
          console.log('\nImports:')
          importsExports.imports.forEach((imp, i) => {
            console.log(`Import #${i + 1}: ${imp.source.value}`)
          })
        }

        if (importsExports.exports.length > 0) {
          console.log('\nExports:')
          importsExports.exports.forEach((exp, i) => {
            console.log(`Export #${i + 1}: ${exp.type}`)
          })
        }
      }
    }

    console.log('\n' + '-'.repeat(50))
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
  }
}

if (import.meta.url.startsWith('file:') && 
    process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parse(process.argv)
}
