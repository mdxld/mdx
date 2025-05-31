import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(__dirname, '../../')
const TEMPLATES_DIR = path.join(PACKAGE_ROOT, 'templates')

export function getTemplatePath(templatePath: string): string {
  return path.join(TEMPLATES_DIR, templatePath)
}

export function getNextjsTemplatePath(fileName: string): string {
  return path.join(TEMPLATES_DIR, 'nextjs', fileName)
}

export function getAiTemplatePath(): string {
  return path.join(TEMPLATES_DIR, 'ai')
}

export function getNextjsTemplatesDir(): string {
  return path.join(TEMPLATES_DIR, 'nextjs')
}
