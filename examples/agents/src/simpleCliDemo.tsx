import React from 'react';
import { render } from 'ink';
import { SimpleChatUI } from './components/SimpleChatUI.js';

/**
 * React Ink-based chat CLI that simulates OpenAI o4 with web search enabled
 * 
 * Features:
 * - Interactive chat interface built with React Ink
 * - Simulated OpenAI o4-mini integration with thinking indicator
 * - Web search capability simulation
 * - Maintains chat history between interactions
 */

console.log('\n🚀 Starting MDX Simple Chat CLI Demo...\n');
console.log('This is a simplified demonstration of a React Ink-based chat CLI');
console.log('that simulates OpenAI o4 integration with web search capability.\n');

render(<SimpleChatUI />);
