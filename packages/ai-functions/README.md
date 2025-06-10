# ai-functions

A collection of AI-powered functions extracted from the mdxai package, designed to be Node.js independent and filesystem-free.

## Features

- **Core AI Functions**: Template literal functions for text generation, lists, research, and more
- **Utility Functions**: Template parsing, schema validation, and output handling
- **Stream Generation**: Support for streaming AI responses
- **No Filesystem Dependencies**: Pure functions that don't require Node.js filesystem operations

## Installation

```bash
pnpm add ai-functions
```

## Usage

### Basic AI Text Generation

```typescript
import { ai } from 'ai-functions'

const result = await ai`Write a blog post about ${topic}`
```

### List Generation

```typescript
import { list } from 'ai-functions'

const items = await list`5 blog post ideas about ${topic}`
```

### Research

```typescript
import { research } from 'ai-functions'

const result = await research`${query} in the context of ${context}`
```

### Data Extraction

```typescript
import { extract } from 'ai-functions'

const entities = await extract`Extract entities from: ${content}`
```

## Available Functions

- `ai` - Core AI template function
- `list` - List generation function
- `research` - Research function for data gathering
- `extract` - Data extraction function
- `is` - Validation functions
- `say` - Text-to-speech functionality
- `image` - Image generation
- `markdown` - Markdown processing
- `video` - Video generation
- `code` - Code generation
- `deepwiki` - Deep wiki functionality
- `mdx` - MDX processing
- `plan` - Planning and task management
- `scrape` - Web scraping capabilities
- `scope` - Scoping utilities
- `ui` - UI components
- `workflow` - Workflow management

## Utilities

- `parseTemplate` - Template parsing and processing
- `stringifyValue` - Value serialization for AI prompts
- `createUnifiedFunction` - Higher-order function for template literals
- `createZodSchemaFromObject` - Schema generation from objects
- `inferAndValidateOutput` - Output validation
- Stream generation functions

## License

MIT
