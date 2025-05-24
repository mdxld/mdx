import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { StreamingText, TaskList, QueueManager, QueueStatus } from './index.js';
import type { StreamTextResult } from 'ai';
import { MdxDbFs } from '../../lib/mdxdb-fs.js';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { streamText, generateText } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';

async function parseSchemaFromFile(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    return data.schema || data;
  } catch (error) {
    console.error(`Error parsing schema from ${filePath}:`, error);
    return null;
  }
}

async function findSchemaFile(dir: string): Promise<string | null> {
  try {
    const files = await fs.readdir(dir);
    
    const schemaFiles = files.filter(file => 
      file === 'README.md' || file === 'SCHEMA.md' || file === 'SCHEMA.mdx'
    );
    
    if (schemaFiles.length > 0) {
      return path.join(dir, schemaFiles[0]);
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding schema file in ${dir}:`, error);
    return null;
  }
}

async function generateCollectionSchema(description: string): Promise<any> {
  const model = openai('gpt-4o');
  
  const result = await generateText({
    model,
    messages: [
      { role: 'system', content: 'You are a schema generator. Generate a JSON schema for a collection based on the description. The schema should include a name property and a schema object with fields array.' },
      { role: 'user', content: `Generate a collection schema based on this description: ${description}` }
    ]
  });
  
  try {
    const schema = JSON.parse(result.text);
    return schema;
  } catch (error) {
    console.error('Error parsing generated schema:', error);
    return {
      name: `collection-${Date.now()}`,
      schema: {
        fields: [
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Title of the document'
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Description of the document'
          }
        ]
      }
    };
  }
}

async function generateDocumentContent(collectionSchema: any, description: string): Promise<any> {
  const model = openai('gpt-4o');
  
  const dynamicSchema: any = {
    type: 'object',
    properties: {},
    required: []
  };
  
  if (collectionSchema.schema && collectionSchema.schema.fields) {
    for (const field of collectionSchema.schema.fields) {
      dynamicSchema.properties[field.name] = {
        type: field.type,
        description: field.description || `The ${field.name} of the document`
      };
      
      if (field.required) {
        dynamicSchema.required.push(field.name);
      }
    }
  }
  
  dynamicSchema.properties.body = {
    type: 'string',
    description: 'The main content of the document'
  };
  
  const result = await generateText({
    model,
    messages: [
      { role: 'system', content: 'You are a document generator. Generate a JSON document based on the schema description. Include a "body" field with the main content.' },
      { role: 'user', content: `Generate a document for a collection with this description: ${description}` }
    ]
  });
  
  try {
    const document = JSON.parse(result.text);
    return document;
  } catch (error) {
    console.error('Error parsing generated document:', error);
    return {
      title: `Document ${Date.now()}`,
      description: description || 'Generated document',
      body: 'This is a generated document with default content.'
    };
  }
  
  return document;
}

export const App = ({ 
  command, 
  options 
}: { 
  command: string; 
  options: Record<string, any>; 
}) => {
  const [output, setOutput] = useState<string>('');
  const [stream, setStream] = useState<StreamTextResult<never, string> | null>(null);
  const [queueManager] = useState(() => new QueueManager(options.concurrency || 20));
  const [tasks, setTasks] = useState<Array<{ title: string; status: 'pending' | 'active' | 'completed' | 'error' }>>([]);

  useEffect(() => {
    const runCommand = async () => {
      try {
        const mdxDb = new MdxDbFs({ packageDir: process.cwd() });
        
        switch (command) {
          case 'generate-database': {
            const description = options.description;
            const numCollections = options.count || 3;
            
            queueManager.addTask(`Generating database with ${numCollections} collections`, async () => {
              for (let i = 0; i < numCollections; i++) {
                const collectionName = `collection-${i + 1}`;
                
                queueManager.addTask(`Generating schema for ${collectionName}`, async () => {
                  const schema = await generateCollectionSchema(
                    `${description} - Collection ${i + 1} of ${numCollections}`
                  );
                  
                  setOutput(prev => `${prev}\nGenerated schema for ${collectionName}:\n${JSON.stringify(schema, null, 2)}\n`);
                  
                  const collections = {
                    [schema.name]: {
                      name: schema.name,
                      pattern: `content/${schema.name}/**/*.mdx`,
                      schema: schema.schema
                    }
                  };
                  
                  
                  const collectionDir = path.join(process.cwd(), 'content', schema.name);
                  await fs.mkdir(collectionDir, { recursive: true });
                  
                  const readmeContent = matter.stringify(
                    `# ${schema.name} Collection\n\nThis collection was generated by mdxdb.`,
                    { schema: schema.schema }
                  );
                  
                  await fs.writeFile(path.join(collectionDir, 'README.md'), readmeContent);
                });
              }
              
              await mdxDb.build();
              setOutput(prev => `${prev}\nDatabase built successfully with ${numCollections} collections.`);
            });
            break;
          }
            
          case 'generate-collection': {
            const description = options.description;
            const name = options.name || `collection-${Date.now()}`;
            
            queueManager.addTask(`Generating collection: ${name}`, async () => {
              const schema = await generateCollectionSchema(description);
              
              setOutput(prev => `${prev}\nGenerated schema for ${name}:\n${JSON.stringify(schema, null, 2)}\n`);
              
              const collections = {
                [schema.name]: {
                  name: schema.name,
                  pattern: `content/${schema.name}/**/*.mdx`,
                  schema: schema.schema
                }
              };
              
              
              const collectionDir = path.join(process.cwd(), 'content', schema.name);
              await fs.mkdir(collectionDir, { recursive: true });
              
              const readmeContent = matter.stringify(
                `# ${schema.name} Collection\n\nThis collection was generated by mdxdb.`,
                { schema: schema.schema }
              );
              
              await fs.writeFile(path.join(collectionDir, 'README.md'), readmeContent);
              
              await mdxDb.build();
              setOutput(prev => `${prev}\nCollection ${schema.name} created successfully.`);
            });
            break;
          }
            
          case 'generate-documents': {
            const collectionName = options.collection;
            const count = options.count || 1;
            const description = options.description || '';
            
            if (!collectionName) {
              setOutput('Error: Collection name is required.');
              return;
            }
            
            queueManager.addTask(`Generating ${count} documents for collection: ${collectionName}`, async () => {
              const collectionDir = path.join(process.cwd(), 'content', collectionName);
              const schemaFile = await findSchemaFile(collectionDir);
              
              if (!schemaFile) {
                setOutput(prev => `${prev}\nError: Schema file not found for collection ${collectionName}.`);
                return;
              }
              
              const schema = await parseSchemaFromFile(schemaFile);
              
              if (!schema) {
                setOutput(prev => `${prev}\nError: Failed to parse schema for collection ${collectionName}.`);
                return;
              }
              
              for (let i = 0; i < count; i++) {
                queueManager.addTask(`Generating document ${i + 1} of ${count}`, async () => {
                  const document = await generateDocumentContent(
                    schema,
                    `${description} - Document ${i + 1} for collection ${collectionName}`
                  );
                  
                  const body = document.body || '';
                  delete document.body;
                  
                  const id = `doc-${Date.now()}-${i}`;
                  
                  await mdxDb.set(id, { frontmatter: document, body }, collectionName);
                  
                  setOutput(prev => `${prev}\nGenerated document ${i + 1} with ID: ${id}`);
                });
              }
              
              setOutput(prev => `${prev}\n${count} documents generated successfully for collection ${collectionName}.`);
            });
            break;
          }
            
          default:
            setOutput(`Unknown command: ${command}`);
        }
      } catch (error) {
        setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    runCommand();
    
    return () => {
    };
  }, [command, options, queueManager]);

  useEffect(() => {
    return queueManager.subscribe(newTasks => {
      setTasks(newTasks);
    });
  }, [queueManager]);

  return (
    <Box flexDirection="column">
      {stream ? (
        <StreamingText 
          stream={stream} 
          onComplete={(text) => setOutput(text)} 
        />
      ) : (
        <>
          {tasks.length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <QueueStatus queue={queueManager} />
            </Box>
          )}
          {output && <Text>{output}</Text>}
        </>
      )}
    </Box>
  );
};

export function renderApp(command: string, options: Record<string, any>) {
  const { unmount } = render(<App command={command} options={options} />);
  return unmount;
}
