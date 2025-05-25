import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { findMdxFiles } from '../utils/mdx-parser';
import { findIndexFile, buildRouteTree, RouteNode, findRouteByPath, filePathToRouteSegments } from '../utils/file-utils';
import { MDXRenderer } from './MDXRenderer';
import pkg from '../../package.json' with { type: 'json' };

interface MDXAppProps {
  initialFilePath?: string;
  mode?: 'browse' | 'test' | 'dev' | 'build' | 'start' | 'exec';
  options?: Record<string, any>;
}

/**
 * Main application component for the MDXE CLI
 */
export const MDXApp: React.FC<MDXAppProps> = ({ 
  initialFilePath, 
  mode = 'browse',
  options = {} 
}) => {
  const { exit } = useApp();
  const [currentScreen, setCurrentScreen] = useState<string>('main');
  const [mdxFiles, setMdxFiles] = useState<string[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<string | null>(initialFilePath || null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [routeTree, setRouteTree] = useState<RouteNode | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string[]>([]);
  const [currentRouteNode, setCurrentRouteNode] = useState<RouteNode | null>(null);

  useInput((input, key) => {
    if (currentScreen === 'main') {
      if (currentRouteNode) {
        const items = currentRouteNode.children;
        
        if (key.downArrow && selectedFileIndex < items.length - 1) {
          setSelectedFileIndex(prev => prev + 1);
        } else if (key.upArrow && selectedFileIndex > 0) {
          setSelectedFileIndex(prev => prev - 1);
        } else if (key.return) {
          const selectedItem = items[selectedFileIndex];
          
          if (selectedItem.type === 'directory') {
            setCurrentRoute([...currentRoute, selectedItem.name]);
            setCurrentRouteNode(selectedItem);
            setSelectedFileIndex(0);
          } else {
            setSelectedFile(selectedItem.path);
            setCurrentScreen('file');
          }
        } else if (key.leftArrow && currentRoute.length > 0) {
          const newRoute = [...currentRoute];
          newRoute.pop();
          setCurrentRoute(newRoute);
          
          if (routeTree) {
            const parentNode = findRouteByPath(routeTree, newRoute);
            if (parentNode) {
              setCurrentRouteNode(parentNode);
              setSelectedFileIndex(0);
            }
          }
        } else if (input === 'q') {
          exit();
        }
      } else {
        if (key.downArrow && selectedFileIndex < mdxFiles.length - 1) {
          setSelectedFileIndex(prev => prev + 1);
        } else if (key.upArrow && selectedFileIndex > 0) {
          setSelectedFileIndex(prev => prev - 1);
        } else if (key.return) {
          setSelectedFile(mdxFiles[selectedFileIndex]);
          setCurrentScreen('file');
        } else if (input === 'q') {
          exit();
        }
      }
    } else if (currentScreen === 'file') {
      if (input === 'b' || key.escape) {
        setCurrentScreen('main');
        setSelectedFile(null);
        setFileContent(null);
      } else if (input === 'q') {
        exit();
      }
    }
  });

  useEffect(() => {
    const loadRouteTree = async () => {
      try {
        setLoading(true);
        const tree = await buildRouteTree(process.cwd());
        setRouteTree(tree);
        setCurrentRouteNode(tree);
        
        const files = await findMdxFiles(process.cwd());
        setMdxFiles(files);
      } catch (err) {
        setError(`Error building route tree: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    loadRouteTree();
  }, []);

  useEffect(() => {
    const loadFileContent = async () => {
      if (selectedFile) {
        try {
          const content = await fs.readFile(selectedFile, 'utf-8');
          setFileContent(content);
        } catch (err) {
          setError(`Error reading file: ${err instanceof Error ? err.message : String(err)}`);
          setCurrentScreen('main');
        }
      }
    };

    loadFileContent();
  }, [selectedFile]);

  useEffect(() => {
    if (initialFilePath) {
      setSelectedFile(initialFilePath);
      setCurrentScreen('file');
    }
  }, [initialFilePath]);

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">🔍 Finding MDX files in current directory...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  if ((mdxFiles.length === 0 && !routeTree) || (routeTree && routeTree.children.length === 0 && !routeTree.indexFile)) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ No MDX files found in the current directory.</Text>
        <Text>Create a README.md or index.mdx file to get started.</Text>
      </Box>
    );
  }

  if (currentScreen === 'file' && selectedFile && fileContent) {
    return (
      <Box flexDirection="column">
        <Box borderStyle="single" borderColor="blue" padding={1} marginBottom={1}>
          <Text bold color="blue">File: {path.basename(selectedFile)}</Text>
        </Box>
        <MDXRenderer content={fileContent} filePath={selectedFile} />
        <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
          <Text dimColor>Press <Text color="yellow">b</Text> to go back or <Text color="yellow">q</Text> to quit</Text>
        </Box>
      </Box>
    );
  }

  if (currentRouteNode?.indexFile && currentScreen === 'main' && initialFilePath === undefined) {
    return (
      <Box flexDirection="column">
        <Box borderStyle="double" borderColor="green" padding={1} marginBottom={1}>
          <Text bold color="green">
            MDXE - Markdown/MDX Execution Engine v{pkg.version}
          </Text>
        </Box>
        <MDXRenderer content={fileContent || ''} filePath={currentRouteNode.indexFile} />
        <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
          <Text dimColor>Press <Text color="yellow">q</Text> to quit</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="green" padding={1} marginBottom={1}>
        <Text bold color="green">
          MDXE - Markdown/MDX Execution Engine v{pkg.version}
        </Text>
      </Box>
      
      {/* Breadcrumb navigation */}
      {currentRoute.length > 0 && (
        <Box marginBottom={1}>
          <Text color="blue">
            <Text color="gray">{'/'}</Text>
            {currentRoute.map((segment, i) => (
              <React.Fragment key={i}>
                <Text color="blue">{segment}</Text>
                <Text color="gray">{'/'}</Text>
              </React.Fragment>
            ))}
          </Text>
        </Box>
      )}
      
      {currentRouteNode ? (
        <>
          <Text>
            {currentRouteNode.indexFile ? 
              `Directory with index file: ${path.basename(currentRouteNode.indexFile)}` : 
              `Found ${currentRouteNode.children.length} item(s)`}. 
            Use arrow keys to navigate, Enter to select:
          </Text>
          <Box flexDirection="column" marginY={1}>
            {currentRouteNode.children.map((item, index) => (
              <Text key={index} color={index === selectedFileIndex ? 'green' : undefined}>
                {index === selectedFileIndex ? '→ ' : '  '}
                {item.type === 'directory' ? 
                  <Text color="blue">{item.name}/</Text> : 
                  <Text>{item.name}</Text>}
              </Text>
            ))}
          </Box>
          <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
            <Text dimColor>
              Press <Text color="yellow">←</Text> to go back, <Text color="yellow">↑/↓</Text> to navigate, <Text color="yellow">Enter</Text> to select, <Text color="yellow">q</Text> to quit
            </Text>
          </Box>
        </>
      ) : (
        <>
          <Text>Found {mdxFiles.length} MDX file(s). Use arrow keys to navigate, Enter to select:</Text>
          <Box flexDirection="column" marginY={1}>
            {mdxFiles.map((file, index) => (
              <Text key={index} color={index === selectedFileIndex ? 'green' : undefined}>
                {index === selectedFileIndex ? '→ ' : '  '}
                {path.relative(process.cwd(), file)}
              </Text>
            ))}
          </Box>
          <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
            <Text dimColor>Press <Text color="yellow">q</Text> to quit</Text>
          </Box>
        </>
      )}
    </Box>
  );
};
