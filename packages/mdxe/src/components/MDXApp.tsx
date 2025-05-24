import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { findMdxFiles } from '../utils/mdx-parser';
import { findIndexFile } from '../utils/file-utils';
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

  useInput((input, key) => {
    if (currentScreen === 'main') {
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
    const loadMdxFiles = async () => {
      try {
        setLoading(true);
        const files = await findMdxFiles(process.cwd());
        setMdxFiles(files);
      } catch (err) {
        setError(`Error finding MDX files: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    loadMdxFiles();
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

  if (mdxFiles.length === 0) {
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

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="green" padding={1} marginBottom={1}>
        <Text bold color="green">
          MDXE - Markdown/MDX Execution Engine v{pkg.version}
        </Text>
      </Box>
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
    </Box>
  );
};
