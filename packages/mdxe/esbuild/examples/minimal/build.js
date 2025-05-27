import { buildMdxContent } from '@mdxe/esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

buildMdxContent({
  contentDir: path.join(__dirname, 'content'),
  outFile: path.join(__dirname, 'dist/content.mjs'),
  watch: process.argv.includes('--watch'),
}).catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
