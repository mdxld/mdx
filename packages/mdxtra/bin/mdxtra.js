#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const [, , cmd = 'dev', ...rest] = process.argv
const here = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(here, '../app')
const link = resolve(appDir, 'content')

await fs.rm(link, { force: true, recursive: true }).catch(() => {})
await fs.symlink(process.cwd(), link, 'junction')

spawn('node', [require.resolve('next/dist/bin/next'), cmd, appDir, ...rest], { stdio: 'inherit' })
