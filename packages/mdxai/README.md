# `mdxai` - Generate & Edit Markdown & MDX

`mdxai` is a command line tool and library for AI-assisted content creation. It leverages large language models to generate new Markdown/MDX files or edit existing ones based on natural language prompts. The package is designed to work hand in hand with the rest of the `mdx*` ecosystem, providing a streamlined workflow for authoring rich documents.

## Features

- Prompt-driven generation of Markdown and MDX content.
- Editing commands to refactor or extend existing files.
- Pluggable model backends so you can use the LLM provider of your choice.
- Can integrate with `mdxdb` for storage and querying of generated content.
- Programmatic API for integration into Node.js applications.

## CLI Usage

```bash
mdxai generate 100 blog post titles about the future of work post-AGI
```

Use `--json` to receive structured output:

```bash
mdxai generate "A short poem" --json
```

Example response:

```json
{
  "status": "success",
  "content": "...generated text..."
}
```

## Programmatic API

In addition to the CLI, `mdxai` can be used programmatically in your Node.js applications:

```javascript
import { generate } from 'mdxai';

// Generate content with default options (draft type)
const result = await generate('Write a blog post about AI and content creation');

// Use the streaming API
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// Or get the complete content as a string
const content = await result.text();
console.log(content);
```

### Options

The `generate` function accepts the following options:

```typescript
generate(prompt: string, options?: {
  // Type of content to generate ('title', 'outline', or 'draft')
  type?: 'title' | 'outline' | 'draft';
  
  // Custom model provider (defaults to OpenAI)
  modelProvider?: any;
  
  // Model ID (defaults to 'gpt-4o')
  modelId?: string;
});
```

Returns an object with:
- `textStream`: An async iterable of content chunks as they are generated
- `text()`: An async function that returns the complete content as a string

Note: An `OPENAI_API_KEY` environment variable must be set when using this function.
