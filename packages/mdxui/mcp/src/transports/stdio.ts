import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

export interface StdioTransportOptions {
  server: Server
}

export class MDXStdioTransport {
  private transport: StdioServerTransport
  private server: Server
  
  constructor(options: StdioTransportOptions) {
    this.server = options.server
    this.transport = new StdioServerTransport()
  }
  
  async connect(): Promise<void> {
    try {
      await this.server.connect(this.transport)
      console.error('MDX MCP Server connected via stdio transport')
    } catch (error) {
      console.error('Failed to connect stdio transport:', error)
      throw error
    }
  }
  
  async close(): Promise<void> {
    try {
      await this.transport.close()
      console.error('MDX MCP Server stdio transport closed')
    } catch (error) {
      console.error('Failed to close stdio transport:', error)
      throw error
    }
  }
  
  getTransport(): StdioServerTransport {
    return this.transport
  }
}

export async function createStdioTransport(server: Server): Promise<MDXStdioTransport> {
  return new MDXStdioTransport({ server })
}
