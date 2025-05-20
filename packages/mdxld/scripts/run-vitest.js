import { spawnSync } from 'child_process'
const args = process.argv.slice(2).filter(a => a !== '--if-present')
const result = spawnSync('./node_modules/.bin/vitest', args, { stdio: 'inherit', shell: true })
process.exit(result.status ?? 1)
