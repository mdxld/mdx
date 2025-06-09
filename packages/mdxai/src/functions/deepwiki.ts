import { experimental_createMCPClient as createMCPClient, generateText } from 'ai'
import { createAIModel } from '../ai'

export const deepwikiMcpClient = await createMCPClient({
  transport: {
    type: 'sse',
    url: 'https://mcp.deepwiki.com/sse',
  },
})

export const tools = await deepwikiMcpClient.tools()

export type Repo = {
  /**
   * GitHub repository: owner/repo (e.g. "facebook/react")
   */
  repoName: string
}

export type DeepWikiQuestion = Repo & {
  /**
   * The question to ask about the repository
   */
  question: string
}

const options = { messages: [], toolCallId: '' }

export const deepwiki = {
  readWikiStructure: ({ repoName }: Repo) => tools.read_wiki_structure.execute({ repoName }, options),
  readWikiContents: ({ repoName }: Repo) => tools.read_wiki_contents.execute({ repoName }, options),
  askQuestion: ({ repoName, question }: DeepWikiQuestion) => tools.ask_question.execute({ repoName, question }, options),
}

// read_wiki_structure: {
//   description: 'Get a list of documentation topics for a GitHub repository'
// read_wiki_contents: {
//   description: 'View documentation about a GitHub repository',
// ask_question: {
//   description: 'Ask any question about a GitHub repository',
  
  //   const deepwikiTools = await mcpClient.tools()
  
  //   return deepwikiTools

// export const deepwiki = async (prompt: string) => {
//   const mcpClient = await createMCPClient({
//     transport: {
//       type: 'sse',
//       url: 'https://mcp.deepwiki.com/sse',
//     },
//   })

//   const deepwikiTools = await mcpClient.tools()

//   return deepwikiTools

// }
