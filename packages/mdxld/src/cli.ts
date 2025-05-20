#!/usr/bin/env node
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import packageJson from '../package.json' with { type: 'json' }
import { parseFrontmatter, convertToJSONLD } from './parser.js'

export function validate(filepath: string): boolean {
  const fullPath = path.resolve(process.cwd(), filepath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`)
  }

  const content = fs.readFileSync(fullPath, 'utf-8')
  const { frontmatter, error } = parseFrontmatter(content)
  if (!frontmatter || error) {
    throw new Error(error || 'Invalid frontmatter')
  }

  try {
    convertToJSONLD(frontmatter)
    return true
  } catch (e: any) {
    throw new Error(e.message)
  }
}

export function run(argv: string[] = process.argv) {
  const program = new Command()
  program
    .name('mdxld')
    .version(packageJson.version)
    .description('MDXLD CLI utilities')

  program
    .command('validate <filepath>')
    .description('Validate an MDXLD file')
    .action((filepath: string) => {
      try {
        validate(filepath)
        console.log('Valid MDXLD.')
      } catch (e: any) {
        console.error(`Validation failed: ${e.message}`)
        process.exitCode = 1
      }
    })

  program.parse(argv)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  run(process.argv)
}
