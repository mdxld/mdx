import path from 'node:path'
import { findMdxFiles } from '../utils/mdx-parser'
import { extractMdxCodeBlocks } from '../utils/mdx-parser'
import { bundleCodeForTesting, runTestsWithVitest } from '../utils/test-runner'

/**
 * Run tests for MDX files in the project
 */
export async function runTestCommand(cwd: string = process.cwd(), watch: boolean = false) {
  try {
    console.log('🧪 MDXE Test Runner')
    console.log(`📁 Current directory: ${cwd}`)
    console.log('')

    const mdxFiles = await findMdxFiles(cwd)

    if (mdxFiles.length === 0) {
      console.log('⚠️ No MDX files found in this directory.')
      return
    }

    console.log(`📄 Found ${mdxFiles.length} MDX files`)
    
    let testFilesCount = 0
    let testBlocksCount = 0
    let successCount = 0
    let failureCount = 0

    for (const filePath of mdxFiles) {
      const { testBlocks, codeBlocks } = await extractMdxCodeBlocks(filePath)
      
      if (testBlocks.length === 0) {
        continue
      }

      testFilesCount++
      testBlocksCount += testBlocks.length
      
      console.log(`\n📝 Testing ${path.relative(cwd, filePath)} (${testBlocks.length} test blocks)`)
      
      const bundledCode = await bundleCodeForTesting(codeBlocks, testBlocks)
      
      const { success, output } = await runTestsWithVitest(bundledCode, filePath, watch)
      
      if (success) {
        successCount++
        console.log(`✅ Tests passed for ${path.relative(cwd, filePath)}`)
      } else {
        failureCount++
        console.log(`❌ Tests failed for ${path.relative(cwd, filePath)}`)
        console.log(output)
      }
    }

    console.log('\n📊 Test Summary:')
    console.log(`📁 Files with tests: ${testFilesCount}/${mdxFiles.length}`)
    console.log(`🧪 Total test blocks: ${testBlocksCount}`)
    console.log(`✅ Passed: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)
    
    if (failureCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('Error running tests:', error)
    process.exit(1)
  }
}
