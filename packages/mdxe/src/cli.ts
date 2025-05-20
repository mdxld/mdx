#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json' with { type: 'json' }

const program = new Command()

program
  .name('mdxe')
  .description('Zero-Config CLI to Execute, Test, & Deploy Markdown & MDX')
  .version(pkg.version, '-v, --version', 'display version information')
  .option('-w, --watch', 'Watch files for changes')

program
  .command('exec [files...]')
  .description('Execute code blocks in Markdown/MDX files')
  .action(() => {
    console.log('exec command not implemented yet')
  })

program
  .command('dev')
  .description('Start a development server')
  .action(() => {
    console.log('dev command not implemented yet')
  })

program
  .command('build')
  .description('Build the project for production')
  .action(() => {
    console.log('build command not implemented yet')
  })

program
  .command('start')
  .description('Start the production server')
  .action(() => {
    console.log('start command not implemented yet')
  })

program
  .command('test')
  .description('Run tests embedded in Markdown/MDX files')
  .action(() => {
    console.log('test command not implemented yet')
  })

program
  .command('lint')
  .description('Lint code blocks in Markdown/MDX files')
  .action(() => {
    console.log('lint command not implemented yet')
  })

program.parse(process.argv)

if (program.opts().watch) {
  console.log('Watch mode enabled (not implemented yet)')
}
