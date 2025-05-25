import React, { ReactNode } from 'react';
import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import Markdown from 'ink-markdown';

/**
 * Props for the Slide component
 * Extends React.HTMLAttributes to maintain the same interface as @mdxui/reveal
 */
interface SlideProps extends React.HTMLAttributes<HTMLElement> {
  /** Index of this slide in the deck (passed by Slides component) */
  index?: number;
  /** Total number of slides in the deck (passed by Slides component) */
  total?: number;
}

/**
 * Terminal-based slide component using Ink
 * Maintains the same interface as @mdxui/reveal's Slide component
 */
export function Slide({ children, index, total, ...props }: SlideProps) {
  let title: ReactNode | null = null;
  let content: ReactNode[] = [];

  const processChildren = (children: ReactNode): void => {
    React.Children.forEach(children, (child) => {
      if (!child) return;

      if (typeof child === 'string') {
        if (child.trim().startsWith('# ')) {
          title = child.trim().substring(2);
        } else if (child.trim().startsWith('## ')) {
          title = child.trim().substring(3);
        } else {
          content.push(child);
        }
        return;
      }

      if (React.isValidElement(child)) {
        const type = child.type as any;
        if (type === 'h1' || type === 'h2') {
          title = child.props.children;
        } else if (type === 'p' || type === 'div' || type === 'span' || type === 'code') {
          content.push(child);
        } else if (child.props && child.props.children) {
          processChildren(child.props.children);
        } else {
          content.push(child);
        }
        return;
      }

      content.push(child);
    });
  };

  processChildren(children);

  return (
    <Box flexDirection="column" padding={1} {...props}>
      {/* Render title with ink-big-text if available */}
      {title && (
        <Box marginBottom={1}>
          <BigText text={typeof title === 'string' ? title : String(title)} font="block" colors={["green"]} />
        </Box>
      )}

      {/* Render content with ink-markdown */}
      <Box flexDirection="column">
        {content.map((item, i) => {
          if (typeof item === 'string') {
            return <Markdown key={i}>{item}</Markdown>;
          }
          return <Box key={i}>{item}</Box>;
        })}
      </Box>
    </Box>
  );
}

Slide.displayName = 'Slide';
