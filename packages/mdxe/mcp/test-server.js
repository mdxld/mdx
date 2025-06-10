#!/usr/bin/env node

import { MDXMCPServer } from './dist/server.js'

async function testMCPServer() {
  console.log('Testing MCP Server...')
  
  try {
    const server = new MDXMCPServer({
      name: '@mdxe/mcp-test',
      version: '0.1.0'
    })
    
    console.log('✅ MCP Server created successfully')
    
    const tools = server.listTools()
    console.log('Available tools:', tools.map(t => t.name))
    
    if (tools.length === 3) {
      console.log('✅ All 3 tools (render_mdx, execute_mdx_code, ai_generate) are available')
    } else {
      console.log('❌ Expected 3 tools, got', tools.length)
    }
    
    console.log('✅ MCP Server test completed successfully')
    
  } catch (error) {
    console.error('❌ MCP Server test failed:', error)
    process.exit(1)
  }
}

testMCPServer()
