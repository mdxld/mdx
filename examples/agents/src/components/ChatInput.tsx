import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ChatInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled = false }) => {
  const [input, setInput] = useState('');
  
  useInput((value, key) => {
    if (disabled) return;
    
    if (key.return) {
      if (input.trim()) {
        onSubmit(input);
        setInput('');
      }
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && !key.shift && value && value.length === 1) {
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
        <Text dimColor>Press Enter to send</Text>
      </Box>
    </Box>
  );
};
