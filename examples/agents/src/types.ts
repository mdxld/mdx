export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatHistory {
  messages: ChatMessage[]
}

export interface Source {
  title: string
  url: string
}

export interface ReasoningPart {
  type: 'reasoning'
  textDelta: string
}

export interface TextDeltaPart {
  type: 'text-delta'
  textDelta: string
}

export interface SourcePart {
  type: 'sources'
  sources: Source[]
}

export type StreamPart = ReasoningPart | TextDeltaPart | SourcePart

export interface MCPSource {
  id: string
  url: string
  transportType: 'sse' | 'stdio'
  status: 'connected' | 'connecting' | 'error'
  errorMessage?: string
}

export interface MCPClient {
  id: string
  client: any // MCP client instance
  tools: Record<string, any>
}
