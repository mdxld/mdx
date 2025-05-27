import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  createAiFolderStructure,
  writeAiFunction,
  findAiFunctionsInHierarchy,
  findAiFunctionEnhanced,
  ensureAiFunctionExists,
  createAiFunctionVersion,
  listAiFunctionVersions,
  AI_FOLDER_STRUCTURE,
} from './utils.js'

describe('AI Folder Management', () => {
  let testDir: string

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `ai-folder-test-${Date.now()}`)
    fs.mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('createAiFolderStructure', () => {
    it('should create the complete .ai folder structure', () => {
      createAiFolderStructure(testDir)

      expect(fs.existsSync(path.join(testDir, '.ai'))).toBe(true)
      expect(fs.existsSync(path.join(testDir, '.ai', 'functions'))).toBe(true)
      expect(fs.existsSync(path.join(testDir, '.ai', 'templates'))).toBe(true)
      expect(fs.existsSync(path.join(testDir, '.ai', 'versions'))).toBe(true)
      expect(fs.existsSync(path.join(testDir, '.ai', 'cache'))).toBe(true)
      expect(fs.existsSync(path.join(testDir, '.ai', 'config.json'))).toBe(true)
    })

    it('should create a default config.json', () => {
      createAiFolderStructure(testDir)

      const configPath = path.join(testDir, '.ai', 'config.json')
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

      expect(config).toMatchObject({
        version: '1.0.0',
        defaultFormat: 'mdx',
        autoCreate: true,
        versioning: true,
      })
    })
  })

  describe('writeAiFunction', () => {
    it('should write an AI function to the functions directory', () => {
      const content = '---\noutput: string\n---\nTest function: ${prompt}'
      const filePath = writeAiFunction('testFunction', content, testDir)

      expect(fs.existsSync(filePath)).toBe(true)
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content)
      expect(filePath).toContain('functions')
    })

    it('should support subfolders', () => {
      const content = '---\noutput: string\n---\nTest function: ${prompt}'
      const filePath = writeAiFunction('testFunction', content, testDir, { subfolder: 'business' })

      expect(fs.existsSync(filePath)).toBe(true)
      expect(filePath).toContain(path.join('functions', 'business'))
    })

    it('should create versions when specified', () => {
      const content = '---\noutput: string\n---\nTest function: ${prompt}'
      writeAiFunction('testFunction', content, testDir, { version: '1.0.0' })

      const versionPath = path.join(testDir, '.ai', 'versions', 'testFunction', '1.0.0.mdx')
      expect(fs.existsSync(versionPath)).toBe(true)
    })
  })

  describe('findAiFunctionsInHierarchy', () => {
    beforeEach(() => {
      createAiFolderStructure(testDir)

      writeAiFunction('rootFunction', '---\noutput: string\n---\nRoot: ${prompt}', testDir)
      writeAiFunction('businessFunction', '---\noutput: object\n---\nBusiness: ${prompt}', testDir, { subfolder: 'business' })
      writeAiFunction('deepFunction', '---\noutput: array\n---\nDeep: ${prompt}', testDir, { subfolder: 'business/marketing' })
    })

    it('should find all AI functions recursively', () => {
      const functions = findAiFunctionsInHierarchy(testDir)

      expect(functions).toHaveLength(3)
      expect(functions.map((f) => f.name)).toContain('rootFunction')
      expect(functions.map((f) => f.name)).toContain('businessFunction')
      expect(functions.map((f) => f.name)).toContain('deepFunction')
    })

    it('should include subfolder information', () => {
      const functions = findAiFunctionsInHierarchy(testDir)

      const businessFunc = functions.find((f) => f.name === 'businessFunction')
      const deepFunc = functions.find((f) => f.name === 'deepFunction')

      expect(businessFunc?.subfolder).toBe('business')
      expect(deepFunc?.subfolder).toBe('business/marketing')
    })
  })

  describe('ensureAiFunctionExists', () => {
    it('should create a function file if it does not exist', () => {
      const filePath = ensureAiFunctionExists('newFunction', testDir)

      expect(fs.existsSync(filePath)).toBe(true)
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toContain('output: string')
      expect(content).toContain('AI function for newFunction')
    })

    it('should return existing file path if function exists', () => {
      const originalPath = writeAiFunction('existingFunction', '---\noutput: string\n---\nExisting', testDir)

      const returnedPath = ensureAiFunctionExists('existingFunction', testDir)

      expect(returnedPath).toBe(originalPath)
    })
  })

  describe('versioning', () => {
    it('should create and list versions correctly', () => {
      const content1 = '---\noutput: string\n---\nVersion 1: ${prompt}'
      const content2 = '---\noutput: string\n---\nVersion 2: ${prompt}'

      createAiFunctionVersion('versionedFunction', content1, '1.0.0', testDir)
      createAiFunctionVersion('versionedFunction', content2, '2.0.0', testDir)

      const versions = listAiFunctionVersions('versionedFunction', testDir)

      expect(versions).toHaveLength(2)
      expect(versions.map((v) => v.version)).toContain('1.0.0')
      expect(versions.map((v) => v.version)).toContain('2.0.0')
    })
  })
})
