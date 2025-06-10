import { Command } from 'commander'
import { MDXMCPServer } from './server.js'
import { createStdioTransport } from './transports/stdio.js'
import { createHttpTransport } from './transports/http.js'

const program = new Command()

program
  .name('mdxe-mcp')
  .description('MDX Model Context Protocol Server')
  .version('0.1.0')

program
  .command('stdio')
  .description('Start MCP server with stdio transport')
  .option('-n, --name <name>', 'Server name', '@mdxe/mcp')
  .option('-v, --version <version>', 'Server version', '0.1.0')
  .action(async (options) => {
    try {
      console.error('Starting MDX MCP Server with stdio transport...')
      
      const server = new MDXMCPServer({
        name: options.name,
        version: options.version
      })
      
      await server.connectStdio()
      
      process.on('SIGINT', () => {
        console.error('Shutting down MDX MCP Server...')
        process.exit(0)
      })
      
      process.on('SIGTERM', () => {
        console.error('Shutting down MDX MCP Server...')
        process.exit(0)
      })
      
    } catch (error) {
      console.error('Failed to start MDX MCP Server:', error)
      process.exit(1)
    }
  })

program
  .command('http')
  .description('Start MCP server with HTTP transport')
  .option('-p, --port <port>', 'HTTP port', '3000')
  .option('-h, --host <host>', 'HTTP host', 'localhost')
  .option('-n, --name <name>', 'Server name', '@mdxe/mcp')
  .option('-v, --version <version>', 'Server version', '0.1.0')
  .action(async (options) => {
    try {
      console.error('Starting MDX MCP Server with HTTP transport...')
      
      const server = new MDXMCPServer({
        name: options.name,
        version: options.version
      })
      
      const port = parseInt(options.port, 10)
      await server.connectHttp(port)
      
      process.on('SIGINT', () => {
        console.error('Shutting down MDX MCP Server...')
        process.exit(0)
      })
      
      process.on('SIGTERM', () => {
        console.error('Shutting down MDX MCP Server...')
        process.exit(0)
      })
      
    } catch (error) {
      console.error('Failed to start MDX MCP Server:', error)
      process.exit(1)
    }
  })

program
  .command('serve')
  .description('Start MCP server (defaults to stdio)')
  .option('-t, --transport <transport>', 'Transport type (stdio|http)', 'stdio')
  .option('-p, --port <port>', 'HTTP port (for http transport)', '3000')
  .option('-h, --host <host>', 'HTTP host (for http transport)', 'localhost')
  .option('-n, --name <name>', 'Server name', '@mdxe/mcp')
  .option('-v, --version <version>', 'Server version', '0.1.0')
  .action(async (options) => {
    try {
      const server = new MDXMCPServer({
        name: options.name,
        version: options.version
      })
      
      if (options.transport === 'http') {
        console.error('Starting MDX MCP Server with HTTP transport...')
        const port = parseInt(options.port, 10)
        await server.connectHttp(port)
      } else {
        console.error('Starting MDX MCP Server with stdio transport...')
        await server.connectStdio()
      }
      
      process.on('SIGINT', () => {
        console.error('Shutting down MDX MCP Server...')
        process.exit(0)
      })
      
      process.on('SIGTERM', () => {
        console.error('Shutting down MDX MCP Server...')
        process.exit(0)
      })
      
    } catch (error) {
      console.error('Failed to start MDX MCP Server:', error)
      process.exit(1)
    }
  })

if (process.argv.length === 2) {
  program.outputHelp()
} else {
  program.parse()
}
