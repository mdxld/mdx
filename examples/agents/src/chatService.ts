import { ChatMessage, StreamPart } from './types.js';

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
