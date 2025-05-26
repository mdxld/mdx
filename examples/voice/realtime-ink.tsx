
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useApp } from 'ink';
import WebSocket from 'ws';
import Mic from 'mic';
import Speaker from 'speaker';

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Please set the OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const MODEL = 'gpt-4o-mini';
const SAMPLE_RATE = 48000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

const App: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const { exit } = useApp();

  useEffect(() => {
    const micInstance = Mic({
      rate: String(SAMPLE_RATE),
      channels: String(CHANNELS),
      bitwidth: String(BIT_DEPTH),
      encoding: 'signed-integer',
      device: 'default'
    });
    const micStream = micInstance.getAudioStream();

    const speaker = new Speaker({
      channels: CHANNELS,
      sampleRate: SAMPLE_RATE,
      bitDepth: BIT_DEPTH
    });

    const params = new URLSearchParams({
      model: MODEL,
      modalities: JSON.stringify(['text','audio'])
    });
    const ws = new WebSocket(`wss://api.openai.com/v1/realtime/conversations?${params}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'conversation.create',
        create: { model: MODEL, modalities: ['text','audio'] }
      }));
      micInstance.start();
      setListening(true);
    });

    micStream.on('data', (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
      }
    });

    ws.on('message', (data) => {
      if (typeof data === 'string') {
        const msg = JSON.parse(data);
        switch (msg.type) {
          case 'response.text.delta':
            setTranscript((t) => t + msg.text);
            break;
          case 'response.text.done':
            setTranscript((t) => t + '\n');
            break;
          case 'response.audio':
            speaker.write(Buffer.from(msg.data, 'base64'));
            break;
          case 'response.end':
            cleanup();
            break;
          default:
            break;
        }
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      cleanup();
    });

    ws.on('close', () => {
      cleanup();
    });

    function cleanup() {
      if (listening) micInstance.stop();
      speaker.end();
      ws.close();
      exit();
    }

  }, []);

  return (
    <Box flexDirection="column">
      <Box>
        <Text>{listening ? '🎤 Listening...' : '🔇 Not listening'}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>{transcript}</Text>
      </Box>
    </Box>
  );
};

render(<App />);
