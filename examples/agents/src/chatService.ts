import { ChatMessage, StreamPart, MCPSource, MCPClient } from './types.js';
import { experimental_createMCPClient, streamText, generateText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { openai } from '@ai-sdk/openai';

/**
 * Detects the transport type based on the input string
 * - If the input starts with http:// or https://, it's an SSE transport
 * - If the input contains spaces, it's a stdio transport
 */
export function detectTransportType(input: string): 'sse' | 'stdio' {
  if (input.startsWith('https://') || input.startsWith('http://')) {
    return 'sse';
  }
  if (input.includes(' ')) {
    return 'stdio';
  }
  throw new Error('Unable to detect transport type. Use https:// for SSE or command with spaces for stdio.');
}

/**
 * Creates an MCP client based on the provided source
 */
export async function createMCPClient(source: MCPSource): Promise<MCPClient> {
  try {
    let client;
    
    if (source.transportType === 'sse') {
      client = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: source.url,
        },
      });
    } else if (source.transportType === 'stdio') {
      const parts = source.url.split(' ');
      const command = parts[0];
      const args = parts.slice(1);
      
      const transport = new Experimental_StdioMCPTransport({
        command,
        args,
      });
      
      client = await experimental_createMCPClient({
        transport,
      });
    } else {
      throw new Error(`Unsupported transport type: ${source.transportType}`);
    }
    
    const tools = await client.tools();
    
    return {
      id: source.id,
      client,
      tools,
    };
  } catch (error) {
    console.error(`Error creating MCP client for ${source.url}:`, error);
    throw error;
  }
}

/**
 * Generates a chat response using MCP tools
 */
export async function generateChatResponseWithMCP(
  messages: ChatMessage[], 
  mcpClients: MCPClient[]
): Promise<AsyncGenerator<StreamPart>> {
  try {
    console.log('Generating chat response with MCP tools...');
    
    const aggregatedTools: Record<string, any> = {};
    
    for (const mcpClient of mcpClients) {
      Object.assign(aggregatedTools, mcpClient.tools);
    }
    
    if (Object.keys(aggregatedTools).length === 0) {
      return mockStreamGenerator(
        "No MCP tools are available. Please add an MCP source first.",
        true,
        false
      );
    }
    
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    const result = streamText({
      model: openai('o4-mini'),
      messages: openaiMessages,
      tools: aggregatedTools,
      providerOptions: {
        openai: {
          reasoningSummary: 'detailed',
        },
      },
    });
    
    return processStreamFromOpenAI(result.fullStream);
  } catch (error) {
    console.error('Error generating chat response with MCP:', error);
    return mockStreamGenerator(
      `Sorry, I encountered an error while using MCP tools: ${error instanceof Error ? error.message : String(error)}`,
      true,
      false
    );
  }
}

/**
 * Processes the OpenAI stream and converts it to our StreamPart format
 */
async function* processStreamFromOpenAI(stream: AsyncIterable<any>): AsyncGenerator<StreamPart> {
  try {
    for await (const part of stream) {
      if (part.type === 'reasoning') {
        yield { type: 'reasoning', textDelta: part.textDelta };
      } else if (part.type === 'text-delta') {
        yield { type: 'text-delta', textDelta: part.textDelta };
      } else if (part.type === 'sources' && part.sources) {
        const sources = part.sources.map((source: any) => ({
          title: source.title || 'Source',
          url: source.url,
        }));
        
        yield { type: 'sources', sources };
      }
    }
  } catch (error) {
    console.error('Error processing OpenAI stream:', error);
    yield { 
      type: 'text-delta', 
      textDelta: `\nError processing response: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Simulates a streaming response for demonstration purposes
 * This function directly yields stream parts without using ReadableStream
 */
export async function* mockStreamGenerator(content: string, includeReasoning = true, includeSources = false): AsyncGenerator<StreamPart> {
  if (includeReasoning) {
    yield { type: 'reasoning', textDelta: 'Analyzing the query... ' };
    await new Promise(resolve => setTimeout(resolve, 300));
    
    yield { type: 'reasoning', textDelta: 'Searching for relevant information... ' };
    await new Promise(resolve => setTimeout(resolve, 300));
    
    yield { type: 'reasoning', textDelta: 'Formulating a comprehensive response based on available data... ' };
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  const words = content.split(' ');
  for (const word of words) {
    yield { type: 'text-delta', textDelta: word + ' ' };
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (includeSources) {
    const sources = [
      { title: 'MDX Documentation', url: 'https://mdxjs.com/' },
      { title: 'MDX GitHub Repository', url: 'https://github.com/mdx-js/mdx' }
    ];
    
    yield { type: 'sources', sources };
  }
}

/**
 * Generates a streaming chat response
 * In a real implementation, this would use the OpenAI API
 */
export async function generateChatResponse(messages: ChatMessage[]): Promise<AsyncGenerator<StreamPart>> {
  try {
    console.log('Generating chat response...');
    
    const lastMessage = messages[messages.length - 1].content;
    let response = '';
    
    if (lastMessage.toLowerCase().includes('mdx')) {
      response = "MDX is a format that combines Markdown with JSX. It allows you to write JSX directly in your Markdown documents, enabling you to include React components within your content. This makes it powerful for creating interactive documentation, blogs, and other content-heavy applications where you want to mix rich content with interactive components.";
    } else {
      response = "I'm a CLI assistant built with React Ink and simulated OpenAI integration. I can help answer questions and provide information on various topics. For this demo, I work best with questions about MDX, React, or JavaScript.";
    }
    
    return mockStreamGenerator(response);
  } catch (error) {
    console.error('Error generating chat response:', error);
    return mockStreamGenerator("Sorry, I encountered an error while generating a response. Please try again.");
  }
}

/**
 * Generates a chat response with web search enabled
 * In a real implementation, this would use the OpenAI API with web search tools
 */
export async function generateChatResponseWithSearch(messages: ChatMessage[]): Promise<AsyncGenerator<StreamPart>> {
  try {
    console.log('Generating chat response with web search...');
    
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }

    let response = '';
    
    if (lastUserMessage.content.toLowerCase().includes('mdx')) {
      response = "According to the MDX documentation, MDX is a format that combines Markdown with JSX. It allows you to use JSX in your markdown content. You can import components, such as interactive charts or alerts, and embed them within your content. This makes writing long-form content with components a blast. MDX is commonly used in documentation sites, blogs, and content-heavy applications that benefit from React's component model.";
    } else {
      response = "I searched the web for information related to your query. MDX is a powerful format that combines Markdown with JSX, allowing developers to write JSX directly in their Markdown documents. This enables the inclusion of React components within content, making it ideal for interactive documentation and content-rich applications.";
    }
    
    return mockStreamGenerator(response, true, true);
  } catch (error) {
    console.error('Error generating chat response with search:', error);
    return mockStreamGenerator("Sorry, I encountered an error while searching the web. Please try again.", true, false);
  }
}

/**
 * Process the stream and extract content
 * This function is no longer needed since we're using direct generators
 * Kept for backward compatibility
 */
export async function* processStream(stream: AsyncGenerator<StreamPart>): AsyncGenerator<StreamPart> {
  yield* stream;
}
