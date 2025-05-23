#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
import { build } from './build'

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

program.parse(process.argv)
