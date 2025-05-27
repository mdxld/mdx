import React from 'react'
import { render, Box, Text, useInput } from 'ink'
import path from 'node:path'
import fs from 'node:fs/promises'
import pkg from '../package.json' with { type: 'json' }
import { findMdxFiles } from './utils/mdx-parser'
import { findIndexFile } from './utils/file-utils'

const App = () => {
  return React.createElement(Box, null, React.createElement(Text, null, 'MDXE - Markdown/MDX Execution Engine'))
}

/**
 * Run the CLI
 */
export async function run() {
  const cwd = process.argv.length > 2 ? process.argv[2] : process.cwd()
  const resolvedPath = path.resolve(process.cwd(), cwd)

  try {
    const stat = await fs.stat(resolvedPath)
    const workingDir = stat.isDirectory() ? resolvedPath : process.cwd()

    const indexFile = await findIndexFile(workingDir)
    const mdxFiles = await findMdxFiles(workingDir)

    const SimpleApp = () => {
      const [exit, setExit] = React.useState(false)

      useInput((input, key) => {
        if (input === 'q' || key.escape) {
          setExit(true)
        }
      })

      if (exit) {
        return null
      }

      return React.createElement(
        Box,
        { flexDirection: 'column', padding: 1 },
        React.createElement(
          Box,
          { marginBottom: 1 },
          React.createElement(Text, { bold: true, color: 'green' }, 'MDXE - Markdown/MDX-First Application Framework'),
        ),

        React.createElement(
          Box,
          { marginBottom: 1 },
          React.createElement(Text, null, 'Current directory: ', React.createElement(Text, { color: 'blue' }, workingDir)),
        ),

        indexFile &&
          React.createElement(
            Box,
            { marginBottom: 1 },
            React.createElement(Text, null, 'Found index file: ', React.createElement(Text, { color: 'green' }, path.basename(indexFile))),
          ),

        React.createElement(Box, { marginY: 1 }, React.createElement(Text, { bold: true }, 'Available MDX Files:')),

        mdxFiles.length > 0
          ? React.createElement(
              Box,
              { flexDirection: 'column', marginY: 1 },
              ...mdxFiles.map((file, index) =>
                React.createElement(
                  Text,
                  { key: file },
                  React.createElement(Text, { color: 'yellow' }, `${index + 1}`),
                  React.createElement(Text, null, '. '),
                  React.createElement(Text, null, path.relative(workingDir, file)),
                ),
              ),
            )
          : React.createElement(Box, null, React.createElement(Text, { color: 'yellow' }, 'No MDX files found in this directory.')),

        React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Text, { dimColor: true }, 'Press ', React.createElement(Text, { color: 'yellow' }, 'q'), ' to quit'),
        ),
      )
    }

    const { waitUntilExit } = render(React.createElement(SimpleApp))
    await waitUntilExit()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
}
