#!/usr/bin/env node

import { Command } from 'commander';
import packageJson from '../package.json' with { type: 'json' };
import * as fs from 'fs';
import * as path from 'path';
import { generateContentStream } from './llmService.js';
import { CoreMessage } from 'ai'; // CoreMessage might be needed for type safety

const program = new Command();

program
  .version(packageJson.version)
  .description('A CLI tool for MDX AI')
  .option('--json', 'Emit JSON describing actions/results');

program
  .command('generate <prompt>')
  .option('-o, --output <filepath>', 'Specify output file path')
  .option('-t, --type <contenttype>', 'Specify content type (e.g., title, outline, draft)', 'draft')
  .action(async (prompt: string, options: { output?: string; type: string }) => {
    const { json } = program.opts<{ json: boolean }>()
    try {
      // Ensure OPENAI_API_KEY is set
      if (!process.env.OPENAI_API_KEY) {
        const msg = 'OPENAI_API_KEY environment variable is not set.'
        if (json) {
          console.error(JSON.stringify({ status: 'error', message: msg }))
        } else {
          console.error(msg)
        }
        process.exit(1);
      }

      // const model = openai('gpt-4o'); // Removed: Handled by llmService
      let systemMessage: string | undefined;

      switch (options.type.toLowerCase()) {
        case 'title':
          systemMessage = "You are an expert copywriter. Generate a compelling blog post title based on the following topic.";
          break;
        case 'outline':
          systemMessage = "You are a content strategist. Generate a blog post outline based on the following topic/prompt.";
          break;
        case 'draft':
        default:
          systemMessage = "You are a helpful AI assistant. Generate a Markdown draft based on the following prompt.";
          break;
      }

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tool_choice?: any; tool_calls?: any; }> = [];
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      }
      messages.push({ role: 'user', content: prompt });

      // Ensure messages conform to CoreMessage[]
      const coreMessages: CoreMessage[] = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant', // Cast to specific roles
        content: msg.content,
        // tool_choice and tool_calls are optional and might not be directly part of CoreMessage
        // If they are needed, the CoreMessage type or llmService might need adjustment
      }));

      const result = await generateContentStream({ messages: coreMessages });

      if (options.output) {
        const outputPath = path.resolve(options.output); // Resolve to absolute path
        const writer = fs.createWriteStream(outputPath);
        for await (const delta of result.textStream) {
          writer.write(delta);
        }
        writer.end();
        await new Promise<void>((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        if (json) {
          console.log(JSON.stringify({ status: 'success', outputFile: outputPath }));
        } else {
          console.log(`Content successfully written to ${outputPath}`);
        }
      } else {
        let buffer = '';
        for await (const delta of result.textStream) {
          if (json) {
            buffer += delta;
          } else {
            process.stdout.write(delta);
          }
        }
        if (json) {
          console.log(JSON.stringify({ status: 'success', content: buffer }));
        } else {
          process.stdout.write('\n'); // Add a newline at the end for stdout
        }
      }
    } catch (error) {
      if (json) {
        console.error(JSON.stringify({ status: 'error', message: String(error) }));
      } else {
        console.error('Error during AI generation:', error);
      }
      process.exit(1);
    }
  });

program
  .command('edit <filepath> <instruction>')
  .option('-o, --output <newfilepath>', 'Specify output file path for the edited content. If not provided, the original file will be modified in-place.')
  .action(async (filepath: string, instruction: string, options: { output?: string }) => {
    const { json } = program.opts<{ json: boolean }>()
    try {
      // Ensure OPENAI_API_KEY is set
      if (!process.env.OPENAI_API_KEY) {
        const msg = 'OPENAI_API_KEY environment variable is not set.'
        if (json) {
          console.error(JSON.stringify({ status: 'error', message: msg }))
        } else {
          console.error(msg)
        }
        process.exit(1);
      }

      // Check if input filepath exists
      if (!fs.existsSync(filepath)) {
        const msg = `Error: Input file not found at ${filepath}`
        if (json) {
          console.error(JSON.stringify({ status: 'error', message: msg }))
        } else {
          console.error(msg)
        }
        process.exit(1);
      }

      const originalContent = fs.readFileSync(filepath, 'utf-8');
      // const model = openai('gpt-4o'); // Removed: Handled by llmService

      const messages: CoreMessage[] = [ // Use CoreMessage type directly
        { role: 'system', content: "You are an expert text editor. Apply the user's editing instruction to the provided text. Only output the modified text, without any additional commentary or conversational filler." },
        { role: 'user', content: `Editing Instruction: ${instruction}\n\nOriginal Text:\n${originalContent}` }
      ];

      const result = await generateContentStream({ messages: messages });

      const targetFilepath = options.output ? path.resolve(options.output) : path.resolve(filepath);
      const tempFilepath = targetFilepath + '.tmp';
      const writer = fs.createWriteStream(tempFilepath);

      try {
        for await (const delta of result.textStream) {
          writer.write(delta);
        }
        writer.end();

        // Wait for the writer to finish before renaming
        await new Promise<void>((resolve, reject) => {
          writer.on('finish', () => resolve());
          writer.on('error', (err) => reject(err));
        });

        fs.renameSync(tempFilepath, targetFilepath);
        if (json) {
          console.log(JSON.stringify({ status: 'success', outputFile: targetFilepath }));
        } else {
          console.log(`Content successfully edited and saved to ${targetFilepath}`);
        }
      } catch (e: any) {
        if (fs.existsSync(tempFilepath)) {
          fs.unlinkSync(tempFilepath);
        }
        if (json) {
          console.error(JSON.stringify({ status: 'error', message: String(e) }));
        } else {
          console.error(`Error editing file ${targetFilepath}:`, e);
        }
        process.exit(1);
      }
    } catch (error) {
      if (json) {
        console.error(JSON.stringify({ status: 'error', message: String(error) }));
      } else {
        console.error('Error during AI edit operation:', error);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
