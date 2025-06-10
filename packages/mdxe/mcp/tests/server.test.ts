import { describe, it, expect, beforeEach } from 'vitest'
import { MDXMCPServer } from '../src/server.js'

describe('MDXMCPServer', () => {
  let server: MDXMCPServer

  beforeEach(() => {
    server = new MDXMCPServer({
      name: '@mdxe/mcp-test',
      version: '0.1.0'
    })
  })

  describe('Server Creation', () => {
    it('should create server instance with default configuration', () => {
      const defaultServer = new MDXMCPServer()
      expect(defaultServer).toBeDefined()
      expect(defaultServer.getServer()).toBeDefined()
    })

    it('should create server instance with custom configuration', () => {
      expect(server).toBeDefined()
      expect(server.getServer()).toBeDefined()
    })

    it('should have correct server capabilities', () => {
      const serverInstance = server.getServer()
      expect(serverInstance).toBeDefined()
    })
  })

  describe('Tool Management', () => {
    it('should list all available tools', () => {
      const tools = server.listTools()
      expect(tools).toHaveLength(3)
      expect(tools.map(t => t.name)).toEqual(['render_mdx', 'execute_mdx_code', 'ai_generate'])
    })

    it('should have correct tool descriptions', () => {
      const tools = server.listTools()
      
      const renderTool = tools.find(t => t.name === 'render_mdx')
      expect(renderTool).toBeDefined()
      expect(renderTool?.description).toContain('Render MDX content')
      
      const executeTool = tools.find(t => t.name === 'execute_mdx_code')
      expect(executeTool).toBeDefined()
      expect(executeTool?.description).toContain('Extract and process code blocks')
      
      const aiTool = tools.find(t => t.name === 'ai_generate')
      expect(aiTool).toBeDefined()
      expect(aiTool?.description).toContain('Generate content using AI')
    })
  })

  describe('Transport Methods', () => {
    it('should have connectStdio method', () => {
      expect(typeof server.connectStdio).toBe('function')
    })

    it('should have connectHttp method', () => {
      expect(typeof server.connectHttp).toBe('function')
    })

    it('should throw error for unimplemented HTTP transport', async () => {
      await expect(server.connectHttp()).rejects.toThrow('HTTP transport not yet implemented')
    })
  })
})

describe('MCP Tool Functions', () => {
  describe('render_mdx tool', () => {
    it('should be importable', async () => {
      const { renderTool } = await import('../src/tools/render.js')
      expect(renderTool).toBeDefined()
      expect(typeof renderTool).toBe('function')
    })
  })

  describe('execute_mdx_code tool', () => {
    it('should be importable', async () => {
      const { executeTool } = await import('../src/tools/execute.js')
      expect(executeTool).toBeDefined()
      expect(typeof executeTool).toBe('function')
    })
  })

  describe('ai_generate tool', () => {
    it('should be importable', async () => {
      const { aiTool } = await import('../src/tools/ai.js')
      expect(aiTool).toBeDefined()
      expect(typeof aiTool).toBe('function')
    })
  })
})

describe('Transport Implementations', () => {
  describe('stdio transport', () => {
    it('should be importable', async () => {
      const stdioTransport = await import('../src/transports/stdio.js')
      expect(stdioTransport).toBeDefined()
    })
  })

  describe('http transport', () => {
    it('should be importable', async () => {
      const httpTransport = await import('../src/transports/http.js')
      expect(httpTransport).toBeDefined()
    })
  })
})

describe('CLI Interface', () => {
  it('should be importable', async () => {
    const cli = await import('../src/cli.js')
    expect(cli).toBeDefined()
  })
})

describe('Package Dependencies', () => {
  it('should be able to import MCP SDK', async () => {
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js')
    expect(Server).toBeDefined()
  })

  it('should be able to import MCP SDK types', async () => {
    const types = await import('@modelcontextprotocol/sdk/types.js')
    expect(types.CallToolRequestSchema).toBeDefined()
    expect(types.ListToolsRequestSchema).toBeDefined()
  })

  it('should be able to import zod for validation', async () => {
    const { z } = await import('zod')
    expect(z).toBeDefined()
  })
})
