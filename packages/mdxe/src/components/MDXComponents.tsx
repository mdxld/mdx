import React from 'react';
import { Box, Text } from 'ink';
import { Markdown, landingPageComponents } from '@mdxui/ink';

/**
 * MDX components for rendering in the terminal
 */
export const MDXComponents = {
  h1: (props: any) => <Text bold color="blue" {...props} />,
  h2: (props: any) => <Text bold color="cyan" {...props} />,
  h3: (props: any) => <Text bold color="green" {...props} />,
  h4: (props: any) => <Text bold {...props} />,
  h5: (props: any) => <Text bold {...props} />,
  h6: (props: any) => <Text bold {...props} />,
  
  p: (props: any) => <Text {...props} />,
  blockquote: (props: any) => (
    <Box borderStyle="single" borderColor="yellow" paddingX={1} marginY={1}>
      <Text italic color="yellow" {...props} />
    </Box>
  ),
  ul: (props: any) => <Box flexDirection="column" marginLeft={2} {...props} />,
  ol: (props: any) => <Box flexDirection="column" marginLeft={2} {...props} />,
  li: (props: any) => <Text>• {props.children}</Text>,
  
  a: (props: any) => <Text color="blue" underline {...props} />,
  strong: (props: any) => <Text bold {...props} />,
  em: (props: any) => <Text italic {...props} />,
  code: (props: any) => <Text color="yellow" {...props} />,
  pre: (props: any) => (
    <Box borderStyle="round" borderColor="gray" padding={1} marginY={1}>
      {props.children}
    </Box>
  ),
  
  hr: () => (
    <Box marginY={1}>
      <Text color="gray">───────────────────────────────────────</Text>
    </Box>
  ),
  
  table: (props: any) => <Box flexDirection="column" marginY={1} {...props} />,
  thead: (props: any) => <Box {...props} />,
  tbody: (props: any) => <Box flexDirection="column" {...props} />,
  tr: (props: any) => <Box {...props} />,
  th: (props: any) => <Text bold underline marginRight={2} {...props} />,
  td: (props: any) => <Text marginRight={2} {...props} />,
  
  Markdown: (props: any) => <Markdown>{props.children}</Markdown>,
  
  ...landingPageComponents
};

/**
 * Create a custom MDX components object with additional components
 */
export function createMDXComponents(customComponents = {}) {
  return {
    ...MDXComponents,
    ...customComponents
  };
}
