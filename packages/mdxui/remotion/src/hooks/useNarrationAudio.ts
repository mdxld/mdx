import { useCallback, useEffect, useState } from 'react';
import { GoogleGenAI } from '@google/genai';

type NarrationOptions = {
  voiceName?: string;
  apiKey?: string;
};

export const useNarrationAudio = (
  narrationText: string,
  options: NarrationOptions = {}
) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateAudio = useCallback(async () => {
    if (!narrationText) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = options.apiKey;
      if (!apiKey) {
        throw new Error('No API key provided for Google GenAI. Please provide it as a prop.');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: narrationText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { 
                voiceName: options.voiceName || 'Kore' 
              },
            },
          },
        },
      });
      
      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) {
        throw new Error('No audio data received from Google GenAI');
      }
      
      const audioBuffer = Buffer.from(data, 'base64');
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio();
      
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => {
          resolve();
        };
        audio.onerror = () => {
          reject(new Error('Failed to load audio metadata'));
        };
        audio.src = audioUrl;
      });
      
      const durationInSeconds = audio.duration;
      
      const fps = 30; // This should match your Remotion configuration
      const durationInFrames = Math.ceil(durationInSeconds * fps);
      
      setAudioSrc(audioUrl);
      setAudioDuration(durationInFrames);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [narrationText, options]);
  
  useEffect(() => {
    generateAudio();
  }, [generateAudio]);
  
  return { audioSrc, audioDuration, isLoading, error, regenerate: generateAudio };
};
