import React from 'react';
import { Box, Text } from 'ink';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  return (
    <Box flexDirection="column" marginY={1}>
      <Text bold color={role === 'user' ? 'green' : 'blue'}>
        {role === 'user' ? 'You' : 'Assistant'}:
      </Text>
      <Box marginLeft={2} marginTop={1}>
        <Text>{content}</Text>
      </Box>
    </Box>
  );
};
