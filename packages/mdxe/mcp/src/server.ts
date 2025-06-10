import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { renderTool } from './tools/render.js'
import { executeTool } from './tools/execute.js'
import { aiTool } from './tools/ai.js'

export interface MCPServerOptions {
  name?: string
  version?: string
}

export class MDXMCPServer {
  private server: Server
  
  constructor(options: MCPServerOptions = {}) {
    this.server = new Server(
      {
        name: options.name || '@mdxe/mcp',
        version: options.version || '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    )
    
    this.setupToolHandlers()
  }
  
  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'render_mdx',
            description: 'Render MDX content to markdown format',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'MDX content to render'
                },
                components: {
                  type: 'object',
                  description: 'Optional React components to provide to MDX',
                  additionalProperties: true
                },
                scope: {
                  type: 'object',
                  description: 'Optional data to provide to the MDX scope',
                  additionalProperties: true
                }
              },
              required: ['content']
            }
          },
          {
            name: 'execute_mdx_code',
            description: 'Execute TypeScript/JavaScript code blocks from MDX content',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'MDX content containing code blocks to execute'
                },
                context: {
                  type: 'object',
                  description: 'Optional execution context variables',
                  additionalProperties: true
                },
                fileId: {
                  type: 'string',
                  description: 'Optional file identifier for shared state'
                }
              },
              required: ['content']
            }
          },
          {
            name: 'ai_generate',
            description: 'Generate AI content using template literals or function calls',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Prompt for AI generation'
                },
                functionName: {
                  type: 'string',
                  description: 'Optional AI function name to execute'
                }
              },
              required: ['prompt']
            }
          }
        ]
      }
    })
    
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      
      try {
        switch (name) {
          case 'render_mdx':
            return await renderTool(args)
            
          case 'execute_mdx_code':
            return await executeTool(args)
            
          case 'ai_generate':
            return await aiTool(args)
            
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        }
      }
    })
  }
  
  async connectStdio() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('MDX MCP Server running on stdio')
  }
  
  async connectHttp(port: number = 3000) {
    throw new Error('HTTP transport not yet implemented')
  }
  
  getServer(): Server {
    return this.server
  }
}

export async function createMDXMCPServer(options: MCPServerOptions = {}): Promise<MDXMCPServer> {
  return new MDXMCPServer(options)
}
