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
  .option('-w, --watch', 'Watch files for changes')
  .action(async (options) => {
    const { findMdxFiles, extractMdxCodeBlocks } = await import('./utils/mdx-parser')
    const { createTempTestFile, runTests, cleanupTempFiles } = await import('./utils/test-runner')
    const path = await import('node:path')

    try {
      console.log('🔍 Finding MDX files...')
      const files = await findMdxFiles(process.cwd())

      if (files.length === 0) {
        console.log('❌ No MDX files found in the current directory.')
        return
      }

      console.log(`📝 Found ${files.length} MDX file(s)`)

      const testFiles: string[] = []
      let hasTests = false

      for (const file of files) {
        const { testBlocks, codeBlocks } = await extractMdxCodeBlocks(file)

        if (testBlocks.length > 0) {
          hasTests = true
          console.log(`🧪 Found ${testBlocks.length} test block(s) in ${path.basename(file)}`)
          const testFile = await createTempTestFile(codeBlocks, testBlocks, file)
          testFiles.push(testFile)
        }
      }

      if (!hasTests) {
        console.log('❌ No test blocks found in MDX files.')
        await cleanupTempFiles()
        return
      }

      console.log('🚀 Running tests...')
      const { success, output } = await runTests(testFiles, options.watch || program.opts().watch)

      console.log(output)

      if (success) {
        console.log('✅ All tests passed!')
      } else {
        console.log('❌ Some tests failed.')
        process.exitCode = 1
      }

      if (!options.watch && !program.opts().watch) {
        await cleanupTempFiles()
      }
    } catch (error) {
      console.error('Error running tests:', error)
      process.exitCode = 1
      await cleanupTempFiles()
    }
  })

program
  .command('lint')
  .description('Lint code blocks in Markdown/MDX files')
  .action(() => {
    console.log('lint command not implemented yet')
  })

/**
 * Run the CLI
 */
export function run() {
  program.parse(process.argv)

  if (program.opts().watch) {
    console.log('Watch mode enabled (not implemented yet)')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
}
