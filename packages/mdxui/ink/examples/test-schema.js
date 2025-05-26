#!/usr/bin/env node
const path = require('path')
const { renderMdxCli } = require('../dist')

async function main() {
  try {
    const mdxPath = path.resolve(__dirname, './deploy.mdx')

    const inputValues = {
      name: 'test-project',
      os: 'Ubuntu',
      memory: 1024,
      region: 'sfo',
    }

    const result = await renderMdxCli(mdxPath, {
      scope: inputValues,
    })

    console.log('\nTest completed successfully!')
    console.log('Input values:', inputValues)
    console.log('Result:', result)
  } catch (error) {
    console.error('Error testing schema validation:', error)
    process.exit(1)
  }
}

main()
