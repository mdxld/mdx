import React from 'react';
import { Box, Text } from 'ink';
import Markdown from 'ink-markdown';
import { parseFrontmatter } from '@mdxui/ink';
import type { MdxFrontmatter } from '@mdxui/ink';

interface MDXRendererProps {
  content: string;
  filePath: string;
}

export const MDXRenderer: React.FC<MDXRendererProps> = ({ content, filePath }) => {
  const { frontmatter, mdxContent } = parseFrontmatter(content);
  
  return (
    <Box flexDirection="column">
      <FrontmatterDisplay frontmatter={frontmatter} />
      <Box marginY={1}>
        <Markdown>{mdxContent}</Markdown>
      </Box>
    </Box>
  );
};

interface FrontmatterDisplayProps {
  frontmatter: MdxFrontmatter;
}

const FrontmatterDisplay: React.FC<FrontmatterDisplayProps> = ({ frontmatter }) => {
  if (Object.keys(frontmatter).length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1} marginBottom={1}>
      <Text bold color="blue">Frontmatter</Text>
      {Object.entries(frontmatter).map(([key, value]) => (
        <Text key={key}>
          <Text color="green">{key}:</Text> {formatValue(value)}
        </Text>
      ))}
    </Box>
  );
};

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}
