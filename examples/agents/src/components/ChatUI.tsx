import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { ChatMessage } from './ChatMessage.js';
import { ChatInput } from './ChatInput.js';
import { ReasoningStream } from './ReasoningStream.js';
import { SourcesList } from './SourcesList.js';
import { ChatMessage as ChatMessageType, Source } from '../types.js';

interface ChatUIProps {
  initialMessages?: ChatMessageType[];
}

export const ChatUI: React.FC<ChatUIProps> = ({ 
  initialMessages = [
    { 
      role: 'system', 
      content: 'You are a helpful assistant that provides accurate and concise information. You can search the web for up-to-date information when needed.' 
    }
  ] 
}) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);
  const [isReasoningComplete, setIsReasoningComplete] = useState(false);
  
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
    
    if (input === 'w' && !isLoading) {
      setWebSearchEnabled(prev => !prev);
    }
    
    if (input === 'r') {
      setShowReasoning(prev => !prev);
    }
  });
  
  const simulateReasoningStream = async () => {
    const reasoningSteps = [
      'Analyzing the query... ',
      'Searching for relevant information... ',
      'Formulating a comprehensive response based on available data... '
    ];
    
    for (const step of reasoningSteps) {
      setCurrentReasoning(prev => prev + step);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsReasoningComplete(true);
  };
  
  const simulateResponseStream = async (response: string) => {
    const words = response.split(' ');
    let fullResponse = '';
    
    for (const word of words) {
      fullResponse += word + ' ';
      setCurrentResponse(fullResponse);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return fullResponse;
  };
  
  const handleSubmit = async (input: string) => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessageType = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setCurrentReasoning('');
    setCurrentResponse('');
    setSources([]);
    setIsReasoningComplete(false);
    
    simulateReasoningStream();
    
    let response = '';
    
    if (input.toLowerCase().includes('mdx')) {
      response = webSearchEnabled 
        ? "According to the MDX documentation, MDX is a format that combines Markdown with JSX. It allows you to use JSX in your markdown content. You can import components, such as interactive charts or alerts, and embed them within your content. This makes writing long-form content with components a blast. MDX is commonly used in documentation sites, blogs, and content-heavy applications that benefit from React's component model."
        : "MDX is a format that combines Markdown with JSX. It allows you to write JSX directly in your Markdown documents, enabling you to include React components within your content. This makes it powerful for creating interactive documentation, blogs, and other content-heavy applications where you want to mix rich content with interactive components.";
    } else {
      response = webSearchEnabled
        ? "I searched the web for information related to your query. The most relevant information I found suggests that your query might be related to JavaScript, React, or web development. Could you provide more specific details about what you're looking for?"
        : "I'm a CLI assistant built with React Ink and simulated OpenAI integration. I can help answer questions and provide information on various topics. For this demo, I work best with questions about MDX, React, or JavaScript.";
    }
    
    setTimeout(async () => {
      try {
        const fullResponse = await simulateResponseStream(response);
        
        if (webSearchEnabled) {
          setSources([
            { title: 'MDX Documentation', url: 'https://mdxjs.com/' },
            { title: 'MDX GitHub Repository', url: 'https://github.com/mdx-js/mdx' }
          ]);
        }
        
        const assistantMessage: ChatMessageType = { 
          role: 'assistant', 
          content: fullResponse.trim() 
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error generating response:', error);
        
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: 'Sorry, I encountered an error while generating a response. Please try again.' 
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };
  
  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1} justifyContent="center">
        <Text bold>
          MDX Chat CLI {webSearchEnabled && <Text color="cyan">[Web Search Enabled]</Text>}
        </Text>
      </Box>
      
      {/* Controls help text */}
      <Box marginBottom={1}>
        <Text dimColor>
          Press <Text color="cyan">w</Text> to toggle web search, 
          <Text color="yellow"> r</Text> to toggle reasoning, 
          <Text color="red"> Ctrl+C</Text> to exit
        </Text>
      </Box>
      
      {/* Chat history */}
      <Box flexDirection="column">
        {messages
          .filter(msg => msg.role !== 'system')
          .map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
      </Box>
      
      {/* Reasoning stream */}
      {showReasoning && (currentReasoning || isLoading) && (
        <ReasoningStream 
          reasoning={currentReasoning} 
          isComplete={isReasoningComplete} 
        />
      )}
      
      {/* Current response being streamed */}
      {currentResponse && isLoading && (
        <Box flexDirection="column" marginY={1}>
          <Text bold color="blue">Assistant:</Text>
          <Box marginLeft={2} marginTop={1}>
            <Text>{currentResponse}</Text>
          </Box>
        </Box>
      )}
      
      {/* Sources list */}
      {sources.length > 0 && <SourcesList sources={sources} />}
      
      {/* Input box */}
      <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
    </Box>
  );
};
