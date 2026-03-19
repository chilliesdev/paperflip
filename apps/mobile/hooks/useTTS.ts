import { useState, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';

export function useTTS() {
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const textRef = useRef<string>('');

  const speak = (text: string) => {
    Speech.stop();
    textRef.current = text;
    setActiveWordIndex(-1);
    setIsPlaying(true);

    const words = text.split(/\s+/);

    Speech.speak(text, {
      onStart: () => setIsPlaying(true),
      onDone: () => {
        setIsPlaying(false);
        setActiveWordIndex(-1);
      },
      onStopped: () => {
        setIsPlaying(false);
        setActiveWordIndex(-1);
      },
      onError: (error) => {
        console.error('TTS Error:', error);
        setIsPlaying(false);
        setActiveWordIndex(-1);
      },
      onBoundary: (event: any) => {
        if (event.charIndex !== undefined) {
          let charCount = 0;
          for (let i = 0; i < words.length; i++) {
            const wordEnd = charCount + words[i].length;
            if (event.charIndex >= charCount && event.charIndex <= wordEnd) {
              setActiveWordIndex(i);
              break;
            }
            charCount = wordEnd + 1; // +1 for the space
          }
        }
      },
    });
  };

  const stop = () => {
    Speech.stop();
    setIsPlaying(false);
    setActiveWordIndex(-1);
  };

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return { speak, stop, activeWordIndex, isPlaying };
}