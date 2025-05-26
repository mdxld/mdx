import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useApp } from 'ink';
import WebSocket from 'ws';
// @ts-ignore
import Mic from 'mic';
import Speaker from 'speaker';


// Load .env from root of the repository
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../..', '.env') })

const API_KEY = process.env.OPENAI_API_KEY
if (!API_KEY) {
  console.error('Please set the OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const MODEL = 'gpt-4o-realtime-preview-2024-12-17'; // Model from new WSS example
const SAMPLE_RATE = 24000; // Sample rate for PCM-16 as per examples
const CHANNELS = 1;
const BIT_DEPTH = 16;

// Function to generate a short beep (sine wave PCM data)
const generateBeepPCM = (durationSeconds: number, frequencyHz: number, sampleRate: number): Buffer => {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const buffer = Buffer.alloc(numSamples * 2); // 16-bit => 2 bytes per sample
  const amplitude = 16383; // Max amplitude for 16-bit signed, using ~half for safety

  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    const sampleValue = Math.floor(amplitude * Math.sin(2 * Math.PI * frequencyHz * time));
    buffer.writeInt16LE(sampleValue, i * 2);
  }
  return buffer;
};

import fs from 'fs'; // Import fs for file writing

const App: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const hasSavedAudioChunkRef = useRef(false); // Flag to save only once, using ref for stable closure
  const { exit } = useApp();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let micInstance: Mic | null = null;
    let speakerInstance: Speaker | null = null;

    const setupRealtimeConnection = () => {
      micInstance = Mic({
        rate: String(SAMPLE_RATE),
        channels: String(CHANNELS),
        bitwidth: String(BIT_DEPTH),
        encoding: 'signed-integer',
        device: 'default'
      });
      const micStream = (micInstance as Mic).getAudioStream();

      speakerInstance = new Speaker({
        channels: CHANNELS,
        sampleRate: SAMPLE_RATE,
        bitDepth: BIT_DEPTH
      });

      // Play a startup beep to test speaker
      console.log('Playing startup beep...');
      const beepSound = generateBeepPCM(0.3, 440, SAMPLE_RATE); // 0.3 sec, 440Hz (A4 note)
      if (speakerInstance) {
        speakerInstance.write(beepSound);
      }
      const websocketUrl = `wss://api.openai.com/v1/realtime?model=${MODEL}`;
      console.log('Connecting to WebSocket:', websocketUrl);

      ws = new WebSocket(websocketUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      // micStream is now defined in this scope
      ws.on('open', () => {
          console.log('WebSocket connected. Attempting to start microphone...');
          // The server sends 'session.created' automatically.
          // We will start sending audio, and the server should respond.

          // Start microphone after connection is open
          if (micInstance) {
            console.log('Attempting to start microphone instance...');
            micInstance.start();
            setListening(true);
            console.log('🎤 Listening... (micInstance.start() called)');
          }
        });

        micStream.on('data', (chunk: Buffer) => {
          console.log(`micStream emitted data, chunk length: ${chunk.length}`);
          if (ws && ws.readyState === WebSocket.OPEN) {
            const base64Audio = chunk.toString('base64');
            // console.log(`Sending input_audio_buffer.append with ${base64Audio.length} chars of base64 audio.`); // Potentially too verbose
            (ws as WebSocket).send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            }));
          } else {
            console.log('micStream data received, but WebSocket not open or null.');
          }
        });

        ws.on('message', (data) => {
          console.log('Raw message received from server:', data.toString()); // Log raw data
          if (typeof data === 'string') {
            const msg = JSON.parse(data);
            switch (msg.type) {
              case 'session.created':
                console.log('Received session.created:', JSON.stringify(msg.session, null, 2));
                if (ws && ws.readyState === WebSocket.OPEN) {
                  const existingTurnDetection = msg.session?.turn_detection || {};
                  const updatePayload = {
                    type: 'session.update',
                    update: {
                      turn_detection: {
                        ...existingTurnDetection, // Spread existing settings
                        interrupt_response: false // Override this specific setting
                      }
                    }
                  };
                  console.log('Sending session.update with interrupt_response: false:', JSON.stringify(updatePayload, null, 2));
                  ws.send(JSON.stringify(updatePayload));
                }
                break;
              case 'response.text.delta':
                setTranscript((t) => t + msg.text);
                break;
              case 'response.text.done':
                setTranscript((t) => t + '\n');
                break;
              case 'response.audio.delta': // Handle delta audio responses
                if (msg.delta) {
                  console.log('Received response.audio.delta with actual delta data.');
                  const audioBuffer = Buffer.from(msg.delta, 'base64');
                  console.log(`Audio buffer length: ${audioBuffer.length}`);
                  if (speakerInstance) {
                    console.log('Attempting to write audioBuffer to speakerInstance...');
                    const writeSuccess = speakerInstance.write(audioBuffer);
                    if (!writeSuccess) {
                      console.warn('speakerInstance.write returned false, buffer might be full.');
                    }
                  } else {
                    console.warn('speakerInstance is null, cannot play audio.');
                  }

                  if (!hasSavedAudioChunkRef.current) {
                    try {
                      fs.writeFileSync('openai_audio_chunk.pcm', audioBuffer);
                      console.log(`Saved first audio chunk to openai_audio_chunk.pcm (Format: PCM S16LE, ${SAMPLE_RATE}Hz, ${CHANNELS}ch)`);
                      hasSavedAudioChunkRef.current = true;
                    } catch (err) {
                      console.error('Error saving audio chunk:', err);
                    }
                  }
                } else {
                  console.log('Received response.audio.delta, but msg.delta is null or empty.');
                }
                break;
              case 'response.audio': 
                if (msg.data) {
                  console.log('Received response.audio with data.');
                  const audioBuffer = Buffer.from(msg.data, 'base64');
                  console.log(`Full audio buffer length (from response.audio): ${audioBuffer.length}`);
                  if (speakerInstance) {
                    console.log('Attempting to write full audioBuffer to speakerInstance...');
                    speakerInstance.write(audioBuffer);
                  } else {
                    console.warn('speakerInstance is null, cannot play full audio from response.audio.');
                  }
                } else {
                  console.log('Received response.audio, but msg.data is null or empty.');
                }
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

        ws.on('close', (code, reason) => {
          console.log(`WebSocket closed. Code: ${code}, Reason: ${reason ? reason.toString() : 'No reason given'}`);
          cleanup();
        });

    };

    function cleanup() {
      console.log('Cleanup called.');
      if (listening && micInstance) {
        micInstance.stop();
      }
      if (speakerInstance) {
        speakerInstance.end();
      }
      if (ws) {
        ws.close();
      }
      setListening(false);
      // exit(); // Keep commented to observe logs
    }

    setupRealtimeConnection();

    return () => {
      console.log('Component unmounting, running cleanup...');
      cleanup();
    };
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
