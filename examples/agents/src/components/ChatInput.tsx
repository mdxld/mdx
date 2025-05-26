import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ChatInputProps {
  onSubmit: (input: string) => void;
  onCommand?: (command: string, args: string[]) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, onCommand, disabled = false }) => {
  const [input, setInput] = useState('');
  
  useInput((value, key) => {
    if (disabled) return;
    
    if (key.return) {
      if (input.trim()) {
        // Check if it's a command (starts with /)
        if (input.trim().startsWith('/')) {
          const parts = input.trim().slice(1).split(' ');
          const command = parts[0];
          const args = parts.slice(1);
          
          if (onCommand) {
            onCommand(command, args);
          }
        } else {
          onSubmit(input);
        }
        setInput('');
      }
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && value && value.length === 1) {
      setInput(prev => prev + value);
    }
  });
  
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text bold color="green">You: </Text>
        <Text>{input}</Text>
        <Text>{!disabled && '_'}</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Press Enter to send. Use commands: /web, /reasoning, /mcp, /tools, /help
        </Text>
      </Box>
    </Box>
  );
};
