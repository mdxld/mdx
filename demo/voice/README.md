# Voice Example with OpenAI Realtime API

This example demonstrates using React Ink to create a CLI application that:

1. Captures audio from your microphone
2. Streams it to OpenAI's Realtime API via WebSockets
3. Displays the transcribed text in real-time
4. Plays back the audio response

## Prerequisites

This example requires several system dependencies:

- Node.js 18+
- ALSA development libraries (for Linux)
  - Ubuntu/Debian: `sudo apt-get install libasound2-dev`
  - Fedora/CentOS: `sudo yum install alsa-lib-devel`
- Python with distutils module

## Environment Setup

You must set your OpenAI API key in the environment:

```bash
export OPENAI_API_KEY="your_api_key"
```

## Running the Example

```bash
pnpm start
```

## How it Works

The application uses:

- `mic` to capture audio from your microphone
- `ws` to establish a WebSocket connection to OpenAI's Realtime API
- `speaker` to play back audio responses
- React Ink for the terminal UI

See `realtime-ink.tsx` for the full implementation details.
