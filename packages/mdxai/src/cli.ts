#!/usr/bin/env node

import { Command } from 'commander'
import packageJson from '../package.json' with { type: 'json' }
import { commands } from './commands/index.js'

const program = new Command()

program.version(packageJson.version).description('A CLI tool for MDX AI').option('--json', 'Emit JSON describing actions/results')

program
  .command('generate <prompt>')
  .option('-o, --output <filepath>', 'Specify output file path')
  .option('-t, --type <contenttype>', 'Specify content type (e.g., title, outline, draft)', 'draft')
  .action(async (prompt: string, options: { output?: string; type: string }) => {
    const { json } = program.opts<{ json: boolean }>()
    await commands.generate(prompt, { ...options, json })
  })

program
  .command('edit <filepath> <instruction>')
  .option('-o, --output <newfilepath>', 'Specify output file path for the edited content. If not provided, the original file will be modified in-place.')
  .action(async (filepath: string, instruction: string, options: { output?: string }) => {
    const { json } = program.opts<{ json: boolean }>()
    await commands.edit(filepath, instruction, { ...options, json })
  })

program
  .command('list <prompt>')
  .option('-o, --output <filepath>', 'Specify output file path', 'index.mdx')
  .option('-f, --format <format>', 'Specify output format (markdown, frontmatter, both)', 'markdown')
  .action(async (prompt: string, options: { output: string; format: string }) => {
    const { json } = program.opts<{ json: boolean }>()
    await commands.list(prompt, { ...options, json })
  })

program
  .command('research <prompt>')
  .option('-o, --output <filepath>', 'Specify output file path', 'research.mdx')
  .option('-f, --format <format>', 'Specify output format (markdown, frontmatter, both)', 'markdown')
  .action(async (prompt: string, options: { output: string; format: string }) => {
    const { json } = program.opts<{ json: boolean }>()
    await commands.research(prompt, { ...options, json })
  })

program
  .command('deepwiki <query>')
  .description('Generate a markdown research document and save it to research/{title}.md')
  .action(async (query: string) => {
    const { json } = program.opts<{ json: boolean }>()
    await commands.deepwiki(query, { json })
  })

program.parse(process.argv)
