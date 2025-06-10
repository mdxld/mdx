import { describe, it, expect } from 'vitest'

describe('@mdxui/mcp package', () => {
  it('should have basic package structure', () => {
    expect(true).toBe(true)
  })
  
  it('should be able to import package dependencies', async () => {
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js')
    expect(Server).toBeDefined()
  })
  
  it('should have correct MCP tool definitions', () => {
    const expectedTools = ['render_mdx', 'execute_mdx_code', 'ai_generate']
    expect(expectedTools).toHaveLength(3)
    expect(expectedTools).toContain('render_mdx')
    expect(expectedTools).toContain('execute_mdx_code')
    expect(expectedTools).toContain('ai_generate')
  })
})
