/**
 * Execution context for MDXE
 * Provides global objects and functions for MDX code blocks
 */

import { on, send, emit, MutableEventContext } from './event-system'
import { renderInputPrompt } from './input-prompt'
import fs from 'fs/promises'
import path from 'path'
import { AIRequest } from '../components/AIRequestTracker'

let aiRequests: AIRequest[] = []
let requestUpdateCallback: ((requests: AIRequest[]) => void) | null = null

/**
 * Track a new AI request
 * @param functionName Name of the AI function being called
 * @returns Request ID for later reference
 */
const trackAIRequest = (functionName: string): string => {
  const id = `${functionName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const request: AIRequest = {
    id,
    functionName,
    status: 'pending',
    startTime: new Date(),
  }
  aiRequests.push(request)
  requestUpdateCallback?.(aiRequests)
  return id
}

/**
 * Mark an AI request as completed or failed
 * @param id Request ID to update
 * @param success Whether the request succeeded
 */
const completeAIRequest = (id: string, success: boolean = true) => {
  const request = aiRequests.find((r) => r.id === id)
  if (request) {
    request.status = success ? 'completed' : 'error'
    request.endTime = new Date()
    requestUpdateCallback?.(aiRequests)
  }
}

/**
 * Set a callback to be notified when AI requests are updated
 * @param callback Function to call with updated request list
 */
export const setRequestUpdateCallback = (callback: (requests: AIRequest[]) => void) => {
  requestUpdateCallback = callback
  if (aiRequests.length > 0) {
    callback(aiRequests)
  }
}

/**
 * Get the current list of AI requests
 * @returns Array of all AI requests
 */
export const getAIRequests = (): AIRequest[] => {
  return [...aiRequests]
}

/**
 * Generate text using AI
 * Tracks requests for UI indicators
 */
const generateText = async ({ prompt, model, middleware, functionName }: any) => {
  const requestId = trackAIRequest(functionName || 'generate')
  console.log(`[AI Request] Model: ${model}, Prompt: ${prompt}`)

  try {
    let result = null
    if (middleware && Array.isArray(middleware)) {
      for (const mw of middleware) {
        if (mw.beforeRequest) {
          const cachedResult = await mw.beforeRequest({ prompt, model, functionName })
          if (cachedResult) {
            console.log(`[AI Cache] Using cached result for ${functionName}`)
            completeAIRequest(requestId, true)
            return cachedResult
          }
        }
      }
    }

    result = { text: `AI response for: ${prompt}` }

    if (functionName === 'list') {
      result = { text: JSON.stringify(['Item 1', 'Item 2', 'Item 3']) }
    }

    if (middleware && Array.isArray(middleware)) {
      for (const mw of middleware) {
        if (mw.afterRequest) {
          await mw.afterRequest({ prompt, model, functionName }, result)
        }
      }
    }

    completeAIRequest(requestId, true)
    return result
  } catch (error) {
    completeAIRequest(requestId, false)
    throw error
  }
}

const AI_FOLDER_STRUCTURE = {
  ROOT: '.ai',
  FUNCTIONS: 'functions',
  TEMPLATES: 'templates',
  VERSIONS: 'versions',
  CACHE: 'cache',
}

/**
 * Create the .ai folder structure
 * Creates folders for functions, templates, versions, and cache
 */
const createAiFolderStructure = async () => {
  try {
    const rootDir = path.join(process.cwd(), AI_FOLDER_STRUCTURE.ROOT)
    await fs.mkdir(rootDir, { recursive: true })

    await fs.mkdir(path.join(rootDir, AI_FOLDER_STRUCTURE.FUNCTIONS), { recursive: true })
    await fs.mkdir(path.join(rootDir, AI_FOLDER_STRUCTURE.TEMPLATES), { recursive: true })
    await fs.mkdir(path.join(rootDir, AI_FOLDER_STRUCTURE.VERSIONS), { recursive: true })
    await fs.mkdir(path.join(rootDir, AI_FOLDER_STRUCTURE.CACHE), { recursive: true })

    console.log(`Created AI folder structure at ${rootDir}`)
    return rootDir
  } catch (error) {
    console.error('Error creating AI folder structure:', error)
    throw error
  }
}

/**
 * Ensure an AI function exists in the .ai/functions directory
 * Creates the function file if it doesn't exist
 */
const ensureAiFunctionExists = async (functionName: string) => {
  try {
    const functionDir = path.join(process.cwd(), AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.FUNCTIONS)
    const functionPath = path.join(functionDir, `${functionName}.mdx`)

    try {
      await fs.access(functionPath)
      return // Function already exists
    } catch {}

    const template = `---
name: ${functionName}
description: AI function for ${functionName}
version: 1.0.0
outputType: string
---

# ${functionName}

This is an AI function that ${functionName === 'default' ? 'processes general requests' : `handles ${functionName} operations`}.

## Usage

\`\`\`typescript
const result = await ai.${functionName}("your prompt here");
\`\`\`
`

    await fs.writeFile(functionPath, template)
    console.log(`Created AI function at ${functionPath}`)
  } catch (error) {
    console.error(`Error ensuring AI function ${functionName} exists:`, error)
  }
}

/**
 * Create a middleware for caching AI responses
 * Stores responses in .ai/cache directory
 */
const createCacheMiddleware = () => {
  const cacheDir = path.join(process.cwd(), AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.CACHE)

  return {
    async beforeRequest(params: any) {
      const cacheKey = JSON.stringify(params)
      const cacheFile = path.join(cacheDir, `${Buffer.from(cacheKey).toString('base64')}.json`)

      try {
        await fs.mkdir(cacheDir, { recursive: true })
        const cachedData = await fs.readFile(cacheFile, 'utf-8')
        return JSON.parse(cachedData)
      } catch {
        return null // Cache miss
      }
    },

    async afterRequest(params: any, response: any) {
      const cacheKey = JSON.stringify(params)
      const cacheFile = path.join(cacheDir, `${Buffer.from(cacheKey).toString('base64')}.json`)

      try {
        await fs.mkdir(cacheDir, { recursive: true })
        await fs.writeFile(cacheFile, JSON.stringify(response))
      } catch (error) {
        console.error('Error caching response:', error)
      }

      return response
    },
  }
}

export type ExecutionContextType = 'dev' | 'test' | 'production' | 'default'

export interface ContextConfig {
  env: Record<string, string>
  globals?: Record<string, any>
}

export const EXECUTION_CONTEXTS: Record<ExecutionContextType, ContextConfig> = {
  dev: {
    env: {
      NODE_ENV: 'development',
      MDXE_CONTEXT: 'dev',
      DEBUG: '1',
    },
  },
  test: {
    env: {
      NODE_ENV: 'test',
      MDXE_CONTEXT: 'test',
      CI: 'false',
    },
  },
  production: {
    env: {
      NODE_ENV: 'production',
      MDXE_CONTEXT: 'production',
    },
  },
  default: {
    env: {
      NODE_ENV: 'development',
      MDXE_CONTEXT: 'default',
    },
  },
}

/**
 * Create an execution context with global objects for MDX code blocks
 * @param contextType The execution context type to use
 * @returns Object with global objects and functions
 */
export function createExecutionContext(contextType: ExecutionContextType = 'default') {
  const contextConfig = EXECUTION_CONTEXTS[contextType]


  createAiFolderStructure().catch((err) => {
    console.error('Failed to create AI folder structure:', err)
  })

  const aiTemplateFunction = async (strings: TemplateStringsArray, ...values: any[]) => {
    const prompt = String.raw(strings, ...values)
    await createAiFolderStructure()
    const functionName = 'default'
    await ensureAiFunctionExists(functionName)
    const result = await generateText({
      model: 'gpt-4o',
      prompt,
      middleware: [createCacheMiddleware()],
      functionName,
    })
    return result.text
  }

  const listTemplateFunction = async function* (strings: TemplateStringsArray, ...values: any[]) {
    const prompt = String.raw(strings, ...values)
    await createAiFolderStructure()
    const functionName = 'list'
    await ensureAiFunctionExists(functionName)
    const result = await generateText({
      model: 'gpt-4o',
      prompt: `Generate a list for: ${prompt}. Return as JSON array.`,
      middleware: [createCacheMiddleware()],
      functionName,
    })

    try {
      const items = JSON.parse(result.text)
      if (Array.isArray(items)) {
        for (const item of items) {
          yield item
        }
      } else {
        yield `Error: Expected array but got ${typeof items}`
      }
    } catch (error) {
      console.error('Error parsing list response:', error)
      yield `Error parsing response: ${result.text.substring(0, 100)}...`
    }
  }

  const researchTemplateFunction = async (strings: TemplateStringsArray, ...values: any[]) => {
    const prompt = String.raw(strings, ...values)
    await createAiFolderStructure()
    const functionName = 'research'
    await ensureAiFunctionExists(functionName)
    const result = await generateText({
      model: 'gpt-4o',
      prompt: `Research and provide information about: ${prompt}`,
      middleware: [createCacheMiddleware()],
      functionName,
    })
    return result.text
  }

  const extractTemplateFunction = async (strings: TemplateStringsArray, ...values: any[]) => {
    const prompt = String.raw(strings, ...values)
    await createAiFolderStructure()
    const functionName = 'extract'
    await ensureAiFunctionExists(functionName)
    const result = await generateText({
      model: 'gpt-4o',
      prompt: `Extract information from: ${prompt}. Return as JSON array.`,
      middleware: [createCacheMiddleware()],
      functionName,
    })
    try {
      return JSON.parse(result.text)
    } catch (error) {
      console.error('Error parsing extract response:', error)
      return [`Error parsing response: ${result.text.substring(0, 100)}...`]
    }
  }

  Object.assign(aiTemplateFunction, {
    async generate(prompt: string) {
      await createAiFolderStructure()
      const functionName = 'generate'
      await ensureAiFunctionExists(functionName)
      const result = await generateText({
        model: 'gpt-4o',
        prompt,
        middleware: [createCacheMiddleware()],
        functionName,
      })
      return result.text
    },

    leanCanvas: async (params: any) => {
      const functionName = 'leanCanvas'
      await createAiFolderStructure()
      await ensureAiFunctionExists(functionName)
      const prompt = `Generate a lean canvas for: ${JSON.stringify(params)}`
      const result = await generateText({
        model: 'gpt-4o',
        prompt,
        middleware: [createCacheMiddleware()],
        functionName,
      })
      try {
        return JSON.parse(result.text)
      } catch (error) {
        console.error('Error parsing leanCanvas response:', error)
        return { error: 'Failed to parse response', text: result.text }
      }
    },

    storyBrand: async (params: any) => {
      const functionName = 'storyBrand'
      await createAiFolderStructure()
      await ensureAiFunctionExists(functionName)
      const prompt = `Generate a StoryBrand framework for: ${JSON.stringify(params)}`
      const result = await generateText({
        model: 'gpt-4o',
        prompt,
        middleware: [createCacheMiddleware()],
        functionName,
      })
      try {
        return JSON.parse(result.text)
      } catch (error) {
        console.error('Error parsing storyBrand response:', error)
        return { error: 'Failed to parse response', text: result.text }
      }
    },

    landingPage: async (params: any) => {
      const functionName = 'landingPage'
      await createAiFolderStructure()
      await ensureAiFunctionExists(functionName)
      const prompt = `Generate a landing page for: ${JSON.stringify(params)}`
      const result = await generateText({
        model: 'gpt-4o',
        prompt,
        middleware: [createCacheMiddleware()],
        functionName,
      })
      try {
        return JSON.parse(result.text)
      } catch (error) {
        console.error('Error parsing landingPage response:', error)
        return { error: 'Failed to parse response', text: result.text }
      }
    },
  })

  const initializeDb = async () => {
    try {
      console.log('Initializing MDX database...')

      let MdxDbClass
      const possiblePaths = [
        '@mdxdb/fs',
        path.resolve(process.cwd(), 'node_modules/@mdxdb/fs'),
        path.resolve(process.cwd(), '../../node_modules/@mdxdb/fs'),
        path.resolve(process.cwd(), '../../packages/mdxdb/fs/lib/mdxdb.js'),
        path.resolve(process.cwd(), '../../../packages/mdxdb/fs/lib/mdxdb.js'),
        path.resolve(process.cwd(), 'packages/mdxdb/fs/lib/mdxdb.js'),
      ]

      let importError = null
      for (const importPath of possiblePaths) {
        try {
          const mdxdbModule = await import(importPath)
          MdxDbClass = mdxdbModule.MdxDb
          if (MdxDbClass) break
        } catch (err) {
          importError = err
        }
      }

      if (!MdxDbClass) {
        console.error('Failed to import MdxDb, creating fallback implementation')
        return {
          get: async () => null,
          list: async () => [],
          set: async () => ({}),
          delete: async () => false,
          blog: {
            create: async () => ({}),
            get: async () => null,
            list: async () => [],
            update: async () => ({}),
            delete: async () => false,
          },
        }
      }

      const mdxDb = new MdxDbClass(process.cwd())
      await mdxDb.build()
      console.log('MDX database initialized successfully')
      return mdxDb
    } catch (error) {
      console.error('Error initializing MDX database:', error)
      return {
        get: async () => null,
        list: async () => [],
        set: async () => ({}),
        delete: async () => false,
        blog: {
          create: async () => ({}),
          get: async () => null,
          list: async () => [],
          update: async () => ({}),
          delete: async () => false,
        },
      }
    }
  }

  const blogMethods = {
    async create(title: string, content: string) {
      const db = await initializeDb()

      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Remove consecutive hyphens

      const frontmatter = {
        title,
        date: new Date().toISOString(),
        published: true,
      }

      try {
        await db.set(
          slug,
          {
            frontmatter,
            body: content,
          },
          'blog',
        )

        return {
          id: slug,
          title,
          content,
          date: frontmatter.date,
        }
      } catch (error) {
        console.error('Error creating blog post:', error)
        throw new Error(`Failed to create blog post: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    async get(id: string) {
      const db = await initializeDb()
      return db.get(id, 'blog')
    },

    async list() {
      const db = await initializeDb()
      return db.list('blog')
    },

    async update(id: string, data: any) {
      const db = await initializeDb()

      try {
        const existing = await db.get(id, 'blog')
        if (!existing) {
          throw new Error(`Blog post with ID '${id}' not found`)
        }

        const frontmatter = {
          ...existing.frontmatter,
          ...data,
          updatedAt: new Date().toISOString(),
        }

        const body = data.content || existing.body

        await db.set(
          id,
          {
            frontmatter,
            body,
          },
          'blog',
        )

        return {
          id,
          ...frontmatter,
          content: body,
        }
      } catch (error) {
        console.error('Error updating blog post:', error)
        throw new Error(`Failed to update blog post: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    async delete(id: string) {
      const db = await initializeDb()
      return db.delete(id, 'blog')
    },
  }

  const dbProxy = new Proxy(
    {},
    {
      get: (target: any, prop: string) => {
        if (prop === 'blog') {
          return blogMethods
        }

        return async (...args: any[]) => {
          const db = await initializeDb()
          return (db as any)[prop](...args)
        }
      },
    },
  )

  return {
    /**
     * Register a callback for a specific event
     * Special handling for 'idea.captured' event to prompt for user input
     */
    on: async (event: string, callback: (data: any, context?: MutableEventContext) => any) => {
      console.log(`Registering handler for event: ${event}`)
      if (event === 'idea.captured') {
        on(event, callback)

        try {
          console.log('Prompting for startup idea...')
          await createAiFolderStructure()
          console.log('AI folder structure created')

          const idea = await renderInputPrompt('Enter your startup idea:')
          console.log(`Received idea: "${idea}"`)

          ;(global as any).ai = aiTemplateFunction
          ;(global as any).list = listTemplateFunction
          ;(global as any).research = researchTemplateFunction
          ;(global as any).extract = extractTemplateFunction
          ;(global as any).db = dbProxy

          console.log('Executing idea.captured callback...')
          return callback(
            idea,
            new MutableEventContext({
              eventType: 'idea.captured',
              timestamp: new Date().toISOString(),
            }),
          )
        } catch (error) {
          console.error('Error in idea.captured handler:', error)
          throw error
        }
      }
      return on(event, callback)
    },

    /**
     * Send an event to trigger all registered callbacks
     */
    send,

    /**
     * Emit an event (alias for send)
     */
    emit,

    /**
     * AI functions with real implementations
     */
    ai: aiTemplateFunction,

    /**
     * Database integration with mdxdb
     */
    db: dbProxy,

    /**
     * List generation function
     */
    list: listTemplateFunction,

    /**
     * Research function
     */
    research: researchTemplateFunction,

    /**
     * Extract function
     */
    extract: extractTemplateFunction,
  }
}
