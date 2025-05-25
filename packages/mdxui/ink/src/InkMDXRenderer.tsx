import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import fs from 'fs/promises';
import { renderMdxCli, compileMdx } from './render';
import { mergeComponents } from './component-loader';
import { defaultComponents } from './components';
import type { MDXComponents } from './component-loader';

export interface InkMDXRendererProps {
  /**
   * Path to the MDX file to render
   */
  file?: string;
  
  /**
   * Raw MDX content to render
   */
  content?: string;
  
  /**
   * Pre-compiled MDX component to render
   */
  Component?: React.ComponentType<any>;
  
  /**
   * Component overrides to use for rendering
   */
  components?: MDXComponents;
  
  /**
   * Additional data to provide to the MDX scope
   */
  scope?: Record<string, any>;
}

/**
 * Renders MDX content in the terminal using Ink
 */
export function InkMDXRenderer({
  file,
  content,
  Component,
  components,
  scope,
}: InkMDXRendererProps) {
  const [mdxComponent, setMdxComponent] = useState<React.ComponentType<any> | null>(
    Component || null
  );
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(!Component && (!!file || !!content));

  const mergedComponents = mergeComponents(defaultComponents, components);

  useEffect(() => {
    if (Component) {
      setMdxComponent(Component);
      return;
    }

    if (!file && !content) {
      setError(new Error('Either file, content, or Component must be provided'));
      setLoading(false);
      return;
    }

    async function loadMdx() {
      try {
        setLoading(true);
        const mdxContent = content || (file ? await fs.readFile(file, 'utf-8') : '');
        const Component = await compileMdx(mdxContent, scope, {
          remarkPlugins: [],
          rehypePlugins: []
        });
        setMdxComponent(() => Component);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setMdxComponent(null);
      } finally {
        setLoading(false);
      }
    }

    loadMdx();
  }, [file, content, Component, JSON.stringify(mergedComponents), JSON.stringify(scope)]);

  if (loading) {
    return <Text>Loading MDX content...</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error rendering MDX:</Text>
        <Text color="red">{error.message}</Text>
      </Box>
    );
  }

  if (!mdxComponent) {
    return <Text>No MDX content to display</Text>;
  }

  const MdxComponent = mdxComponent;
  return <MdxComponent />;
}
