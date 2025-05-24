import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Markdown from 'ink-markdown';
import { parseFrontmatter, createSchemaFromFrontmatter, renderMdxCli } from '@mdxui/ink';
import type { MdxFrontmatter } from '@mdxui/ink';
import fs from 'node:fs/promises';
import path from 'node:path';

interface NavigationAPI {
  navigateTo?: (screen: any) => void;
  navigateToFile?: (filePath: string, title?: string) => void;
  navigateToRoute?: (routePath: string[]) => void;
  goBack?: () => void;
  goForward?: () => void;
}

interface MDXRendererProps {
  content: string;
  filePath: string;
  components?: Record<string, React.ComponentType<any>>;
  inputs?: Record<string, any>;
  navigation?: NavigationAPI;
}

export const MDXRenderer: React.FC<MDXRendererProps> = ({ 
  content, 
  filePath,
  components = {},
  inputs = {},
  navigation
}) => {
  const [compiledMDX, setCompiledMDX] = useState<string | null>(null);
  const [frontmatter, setFrontmatter] = useState<MdxFrontmatter>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const compileMDX = async () => {
      try {
        setLoading(true);
        
        const { frontmatter: fm, mdxContent } = parseFrontmatter(content);
        setFrontmatter(fm);
        
        try {
          await renderMdxCli(content, {
            mdxPath: filePath,
            components: components as any,
            scope: {
              ...inputs,
              navigation
            }
          });
          
          setCompiledMDX(mdxContent);
        } catch (renderError) {
          console.warn('Could not render MDX with renderMdxCli:', renderError);
          setCompiledMDX(mdxContent);
        }
      } catch (err) {
        setError(`Error compiling MDX: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    compileMDX();
  }, [content, filePath, components]);

  if (loading) {
    return (
      <Box>
        <Text color="yellow">Compiling MDX...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <FrontmatterDisplay frontmatter={frontmatter} />
      <Box marginY={1}>
        <Markdown>{compiledMDX || ''}</Markdown>
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

  const { inputSchema, outputSchema } = createSchemaFromFrontmatter(frontmatter);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1} marginBottom={1}>
      <Text bold color="blue">Frontmatter</Text>
      {Object.entries(frontmatter).map(([key, value]) => (
        <Text key={key}>
          <Text color="green">{key}:</Text> {formatValue(value)}
        </Text>
      ))}
      
      {inputSchema && (
        <Box marginTop={1}>
          <Text color="cyan">Input schema defined</Text>
        </Box>
      )}
      
      {outputSchema && (
        <Box marginTop={1}>
          <Text color="magenta">Output schema defined</Text>
        </Box>
      )}
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
