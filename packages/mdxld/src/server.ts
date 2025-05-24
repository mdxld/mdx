import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { build } from './build.js'
import { parseFrontmatter, convertToJSONLD } from './parser.js'
import { parseTaskList } from './task-list.js'

const server = new McpServer({ name: 'mdxld', version: '1.1.6' })

server.tool(
  'build',
  'Build MDX files using Velite with mdxld configuration',
  {
    sourceDir: z.string().optional().describe('Source directory containing MDX files'),
    outputDir: z.string().optional().describe('Output directory for processed files'),
    configFile: z.string().optional().describe('Path to config file'),
    watch: z.boolean().optional().describe('Watch for file changes'),
    bundle: z.boolean().optional().describe('Bundle with esbuild'),
  },
  async (params, extra) => {
    try {
      const result = await build(params)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    } catch (error) {
      throw new Error(`Build failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  },
)

server.tool(
  'parseFrontmatter',
  'Parse YAML-LD frontmatter from MDX content',
  { content: z.string().describe('MDX content to parse') },
  async ({ content }, extra) => {
    const result = parseFrontmatter(content)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  },
)

server.tool(
  'parseTaskList',
  'Parse task list items from Markdown content',
  { content: z.string().describe('Markdown content to parse for task items') },
  async ({ content }, extra) => {
    const result = parseTaskList(content)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  },
)

server.tool(
  'convertToJSONLD',
  'Convert YAML object to JSON-LD format',
  { yamlObject: z.record(z.any()).describe('YAML object to convert') },
  async ({ yamlObject }, extra) => {
    const result = convertToJSONLD(yamlObject)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  },
)

export async function startMcpServer() {
  await server.connect(new StdioServerTransport())
}
