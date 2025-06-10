import { Server } from '@modelcontextprotocol/sdk/server/index.js'

export interface HttpTransportOptions {
  server: Server
  port?: number
  host?: string
}

export class MDXHttpTransport {
  private server: Server
  private port: number
  private host: string
  private httpServer?: any
  
  constructor(options: HttpTransportOptions) {
    this.server = options.server
    this.port = options.port || 3000
    this.host = options.host || 'localhost'
  }
  
  async connect(): Promise<void> {
    try {
      console.error(`Starting MDX MCP Server on http://${this.host}:${this.port}`)
      console.error('HTTP transport implementation pending - using stdio fallback')
      throw new Error('HTTP transport not yet implemented - please use stdio transport')
    } catch (error) {
      console.error('Failed to start HTTP transport:', error)
      throw error
    }
  }
  
  async close(): Promise<void> {
    try {
      if (this.httpServer) {
        await new Promise<void>((resolve, reject) => {
          this.httpServer.close((err: any) => {
            if (err) reject(err)
            else resolve()
          })
        })
        console.error('MDX MCP Server HTTP transport closed')
      }
    } catch (error) {
      console.error('Failed to close HTTP transport:', error)
      throw error
    }
  }
  
  getPort(): number {
    return this.port
  }
  
  getHost(): string {
    return this.host
  }
}

export async function createHttpTransport(server: Server, options: Omit<HttpTransportOptions, 'server'> = {}): Promise<MDXHttpTransport> {
  return new MDXHttpTransport({ server, ...options })
}
