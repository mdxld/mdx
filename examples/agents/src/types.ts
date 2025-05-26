export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
}

export interface Source {
  title: string;
  url: string;
}

export interface ReasoningPart {
  type: 'reasoning';
  textDelta: string;
}

export interface TextDeltaPart {
  type: 'text-delta';
  textDelta: string;
}

export interface SourcePart {
  type: 'sources';
  sources: Source[];
}

export type StreamPart = ReasoningPart | TextDeltaPart | SourcePart;
