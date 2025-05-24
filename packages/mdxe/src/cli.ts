import React from 'react';
import { render, Box, Text, useInput } from 'ink';
import path from 'node:path';
import fs from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };
import { findMdxFiles } from './utils/mdx-parser';
import { findIndexFile, fileExists } from './utils/file-utils';

import { runDevCommand } from './commands/dev';
import { runBuildCommand } from './commands/build';
import { runStartCommand } from './commands/start';

/**
 * Run the CLI
 */
export async function run() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cwd = process.cwd();
  
  if (command === 'dev') {
    return runDevCommand(cwd);
  } else if (command === 'build') {
    return runBuildCommand(cwd);
  } else if (command === 'start') {
    return runStartCommand(cwd);
  } else if (command === 'test') {
    console.log('Test command not implemented yet');
    return;
  } else if (command === 'lint') {
    console.log('Lint command not implemented yet');
    return;
  } else if (command === 'exec') {
    console.log('Exec command not implemented yet');
    return;
  }
  
  let targetDir = cwd;
  
  if (args.length > 0 && command !== 'test' && command !== 'dev' && command !== 'build' && command !== 'start' && command !== 'exec') {
    const resolvedPath = path.resolve(process.cwd(), command);
    try {
      const stat = await fs.stat(resolvedPath);
      if (stat.isDirectory()) {
        targetDir = resolvedPath;
      }
    } catch (err) {
    }
  }
  
  try {
    const SimpleApp = ({ cwd = process.cwd() }) => {
      const [files, setFiles] = React.useState<string[]>([]);
      const [indexFile, setIndexFile] = React.useState<string | null>(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState<string | null>(null);
      const [exit, setExit] = React.useState(false);
    
      React.useEffect(() => {
        const loadFiles = async () => {
          try {
            setLoading(true);
            const mdxFiles = await findMdxFiles(cwd);
            setFiles(mdxFiles);
            
            const index = await findIndexFile(cwd);
            setIndexFile(index);
          } catch (err) {
            setError(`Error loading files: ${err instanceof Error ? err.message : String(err)}`);
          } finally {
            setLoading(false);
          }
        };
        
        loadFiles();
      }, [cwd]);
    
      useInput((input, key) => {
        if (input === 'q' || key.escape) {
          setExit(true);
        }
      });
    
      if (exit) {
        return null;
      }
    
      if (loading) {
        return React.createElement(Box, null,
          React.createElement(Text, { color: "yellow" }, "Loading MDX files...")
        );
      }
    
      if (error) {
        return React.createElement(Box, { flexDirection: "column" },
          React.createElement(Text, { color: "red" }, `Error: ${error}`)
        );
      }
    
      return React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
          React.createElement(Text, { bold: true, color: "green" }, "MDXE - Markdown/MDX-First Application Framework")
        ),
        
        React.createElement(Box, { marginBottom: 1 },
          React.createElement(Text, null, 
            "Current directory: ", 
            React.createElement(Text, { color: "blue" }, cwd)
          )
        ),
        
        indexFile && React.createElement(Box, { marginBottom: 1 },
          React.createElement(Text, null,
            "Found index file: ",
            React.createElement(Text, { color: "green" }, path.basename(indexFile))
          )
        ),
        
        React.createElement(Box, { marginY: 1 },
          React.createElement(Text, { bold: true }, "Available MDX Files:")
        ),
        
        files.length > 0 
          ? React.createElement(Box, { flexDirection: "column", marginY: 1 },
              ...files.map((file, index) => 
                React.createElement(Text, { key: file },
                  React.createElement(Text, { color: "yellow" }, `${index + 1}`),
                  React.createElement(Text, null, ". "),
                  React.createElement(Text, null, path.relative(cwd, file))
                )
              )
            )
          : React.createElement(Box, null,
              React.createElement(Text, { color: "yellow" }, "No MDX files found in this directory.")
            ),
        
        React.createElement(Box, { marginTop: 1 },
          React.createElement(Text, { dimColor: true },
            "Press ",
            React.createElement(Text, { color: "yellow" }, "q"),
            " to quit"
          )
        )
      );
    };
    
    const { waitUntilExit } = render(
      React.createElement(SimpleApp, { cwd: targetDir })
    );
    
    await waitUntilExit();
  } catch (error) {
    console.error('Error running CLI:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
