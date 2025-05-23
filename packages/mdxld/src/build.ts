import { build as veliteBuild } from 'velite'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultConfigPath = join(__dirname, '../velite.config.ts')

/**
 * Build MDX files using Velite with the mdxld configuration
 */
export async function build(options: {
  sourceDir?: string
  outputDir?: string
  configFile?: string
  watch?: boolean
  bundle?: boolean
}) {
  const {
    sourceDir = '.',
    outputDir = '.mdx',
    configFile = defaultConfigPath,
    watch = false,
    bundle = false
  } = options

  const cwd = process.cwd()
  const absoluteSourceDir = resolve(cwd, sourceDir)
  const absoluteOutputDir = resolve(cwd, outputDir)
  const absoluteConfigFile = resolve(cwd, configFile === defaultConfigPath ? configFile : configFile)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const result = await veliteBuild({
    config: absoluteConfigFile,
    watch,
  })

  const indexJs = `export const mdx = ${JSON.stringify(result, null, 2)};`
  const indexDts = `export declare const mdx: any;`
  const mdxJson = JSON.stringify(result, null, 2)

  fs.writeFileSync(join(outputDir, 'index.js'), indexJs)
  fs.writeFileSync(join(outputDir, 'index.d.ts'), indexDts)
  fs.writeFileSync(join(outputDir, 'mdx.json'), mdxJson)

  return result
}
