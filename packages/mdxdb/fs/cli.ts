import { MdxDb } from './lib/mdxdb.js' // Use .js extension for ESM imports
import path from 'path'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'build') {
    console.log('mdxdb: Starting build process...')
    try {
      // Instantiate MdxDb with the current working directory as packageDir
      // This assumes the CLI is run from the root of the project using mdxdb
      const mdxDb = new MdxDb(process.cwd())

      await mdxDb.build()
      console.log('mdxdb: Content build complete.')

      const exportPath = '.db'
      await mdxDb.exportDb(exportPath)
      console.log(`mdxdb: Build output successfully exported to ./${path.basename(exportPath)}`)
      console.log('mdxdb: Build process finished successfully.')
    } catch (error) {
      console.error('mdxdb: Error during build process:')
      if (error instanceof Error) {
        console.error(error.message)
        if (error.stack) {
          console.error(error.stack)
        }
      } else {
        console.error(String(error))
      }
      process.exit(1) // Exit with error code
    }
  } else {
    console.log('Usage: mdxdb build')
    if (command) {
      console.log(`Unknown command: ${command}`)
      process.exit(1) // Exit with error code for unknown command
    }
  }
}

main().catch((error) => {
  console.error('mdxdb: An unexpected error occurred:')
  if (error instanceof Error) {
    console.error(error.message)
    if (error.stack) {
      console.error(error.stack)
    }
  } else {
    console.error(String(error))
  }
  process.exit(1)
})
