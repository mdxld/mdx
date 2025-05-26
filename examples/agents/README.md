# MDX React Ink Chat CLI

A React Ink-based chat CLI that uses OpenAI o4 with web search enabled, high thinking, and streaming thinking.

## Features

- Interactive chat interface built with React Ink
- OpenAI o4-mini integration with detailed reasoning
- Web search capability with source citation
- Streaming responses with visible reasoning process
- Maintains chat history between interactions

## Usage

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run the CLI
pnpm start
```

## Controls

- Press `w` to toggle web search
- Press `r` to toggle reasoning display
- Press `Ctrl+C` to exit

## Implementation Details

This CLI demonstrates the integration of OpenAI's o4-mini model with web search capabilities and detailed reasoning. It uses the following patterns:

- Streaming text with reasoning using `fullStream`
- Web search with `webSearchPreview` tool
- Detailed reasoning summary with `reasoningSummary: 'detailed'`

## Environment Variables

To use the actual OpenAI API integration, set the following environment variable:

```
OPENAI_API_KEY=your_api_key_here
```

Without this key, the CLI will run in demo mode with simulated responses.
