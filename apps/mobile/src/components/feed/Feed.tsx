import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import * as Speech from 'expo-speech';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { splitSentences } from '@paperflip/core';
import { videoSources } from '@paperflip/core';
import { updateDocumentProgress, DEFAULT_SETTINGS } from '@paperflip/core';
import { FeedSlide } from './FeedSlide';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface FeedProps {
  segments: string[];
  initialIndex?: number;
  initialProgress?: number;
  documentId: string;
}

export function Feed({
  segments = [],
  initialIndex = 0,
  initialProgress = 0,
  documentId,
}: FeedProps) {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [currentCharIndex, setCurrentCharIndex] = useState(-1);
  const [highlightEndIndex, setHighlightEndIndex] = useState<number | undefined>(undefined);
  const [highlightStartIndex, setHighlightStartIndex] = useState<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [backgroundUrlIndex, setBackgroundUrlIndex] = useState(0);

  const [isDictationMode, setIsDictationMode] = useState(false);

  // Ref for mutable state that doesn't need to trigger re-renders but is accessed in callbacks
  const stateRef = useRef({
    currentCharIndex: -1,
    currentSegmentProgress: 0,
    isPlaying: false,
    boundaryFired: false,
  });

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundaryCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback((immediate = false) => {
    if (!documentId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    if (immediate) {
      updateDocumentProgress(documentId, activeIndex, stateRef.current.currentSegmentProgress);
    } else {
      saveTimeout.current = (setTimeout(() => {
        updateDocumentProgress(documentId, activeIndex, stateRef.current.currentSegmentProgress);
      }, 1000) as unknown as ReturnType<typeof setTimeout>);
    }
  }, [documentId, activeIndex]);

  const stopTTS = useCallback(async () => {
    await Speech.stop();
    stateRef.current.isPlaying = false;
    setIsPlaying(false);
  }, []);

  const speakKaraoke = useCallback(async (text: string, startIndex: number) => {
    stateRef.current.boundaryFired = false;
    stateRef.current.isPlaying = true;
    setIsPlaying(true);

    const voiceOptions: Speech.SpeechOptions = {
      onBoundary: (event: any) => {
        if (!event || event.charIndex === undefined) return; // Sometimes undefined depending on platform
        stateRef.current.boundaryFired = true;
        if (boundaryCheckTimeout.current) clearTimeout(boundaryCheckTimeout.current);
        const newIndex = event.charIndex + startIndex; // Adjust if using offset (not supported on all platforms natively with offset)
        setCurrentCharIndex(newIndex);
        stateRef.current.currentSegmentProgress = newIndex;
        stateRef.current.currentCharIndex = newIndex;
      },
      onDone: () => {
        if (boundaryCheckTimeout.current) clearTimeout(boundaryCheckTimeout.current);
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
        setCurrentCharIndex(text.length);
        stateRef.current.currentSegmentProgress = text.length;
        setHighlightEndIndex(undefined);
        setHighlightStartIndex(undefined);
        saveProgress(true);
      },
      onStopped: () => {
        // Handled by explicit stops
      },
      onError: () => {
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
      }
    };

    // React Native Expo Speech boundary events are notoriously unreliable across Android/iOS.
    // We add a boundary check fallback similar to web, forcing Dictation mode if not working.
    boundaryCheckTimeout.current = setTimeout(() => {
      if (!stateRef.current.boundaryFired && stateRef.current.isPlaying) {
        console.warn("Boundary events missing or slow, switching to Dictation Mode");
        stopTTS().then(() => {
          setIsDictationMode(true);
          // We can't immediately restart here easily without complex state management in RN
          // This relies on user interaction or the next slide to kick in properly,
          // but for simplicity in parity, we set the mode.
        });
      }
    }, 2500);

    // If there's an offset, some platforms don't support it natively for TTS.
    // For true parity we might need to substring the text if offset > 0.
    const textToSpeak = startIndex > 0 ? text.substring(startIndex) : text;
    Speech.speak(textToSpeak, voiceOptions);

  }, [saveProgress, stopTTS]);

  const speakDictation = useCallback(async (text: string, startIndex: number) => {
    const sentences = splitSentences(text);
    const sentenceQueue = sentences.filter((s) => s.end > startIndex);

    const playNextSentence = async (queue: typeof sentences, originalStartIndex: number) => {
      if (queue.length === 0 || !stateRef.current.isPlaying) {
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
        if (segments[activeIndex]) {
          setCurrentCharIndex(segments[activeIndex].length);
          stateRef.current.currentSegmentProgress = segments[activeIndex].length;
        }
        setHighlightEndIndex(undefined);
        setHighlightStartIndex(undefined);
        saveProgress(true);
        return;
      }

      const currentSentence = queue[0];
      const remaining = queue.slice(1);

      setCurrentCharIndex(currentSentence.start);
      setHighlightEndIndex(currentSentence.end);
      setHighlightStartIndex(currentSentence.start);
      stateRef.current.currentSegmentProgress = currentSentence.start;

      const offset = Math.max(0, originalStartIndex - currentSentence.start);
      const textToSpeak = offset > 0 ? currentSentence.text.substring(offset) : currentSentence.text;

      Speech.speak(textToSpeak, {
        onDone: () => {
          if (!stateRef.current.isPlaying) return;
          playNextSentence(remaining, 0);
        },
        onError: () => {
          setIsPlaying(false);
          stateRef.current.isPlaying = false;
        }
      });
    };

    stateRef.current.isPlaying = true;
    setIsPlaying(true);
    playNextSentence(sentenceQueue, startIndex);

  }, [segments, activeIndex, saveProgress]);


  const speakCurrentSlide = useCallback(async (overrideStartIndex?: number) => {
    await stopTTS();
    if (boundaryCheckTimeout.current) clearTimeout(boundaryCheckTimeout.current);

    setCurrentCharIndex(-1);
    setHighlightEndIndex(undefined);
    setHighlightStartIndex(undefined);

    let startIndex = overrideStartIndex ?? 0;

    // For initial load
    if (overrideStartIndex === undefined && activeIndex === initialIndex && initialProgress > 0) {
      // In a real implementation we'd check if it's the first play,
      // here we simplify to starting at the initialProgress if we're on the initial slide.
      startIndex = initialProgress;
    }

    setCurrentCharIndex(startIndex);
    stateRef.current.currentSegmentProgress = startIndex;
    stateRef.current.currentCharIndex = startIndex;

    const currentSegment = segments[activeIndex];
    if (!currentSegment) return;

    // Use current state settings
    const modeDictation = isDictationMode || !DEFAULT_SETTINGS.karaokeMode;

    if (modeDictation) {
      await speakDictation(currentSegment, startIndex);
    } else {
      await speakKaraoke(currentSegment, startIndex);
    }
  }, [activeIndex, initialIndex, initialProgress, segments, isDictationMode, speakDictation, speakKaraoke, stopTTS]);


  useEffect(() => {
    // Component mount
    if (segments.length > 0) {
      // Small delay to ensure PagerView has settled if not on index 0
      setTimeout(() => {
         speakCurrentSlide();
      }, 500);
    }

    return () => {
      stopTTS();
      if (boundaryCheckTimeout.current) clearTimeout(boundaryCheckTimeout.current);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveProgress(true);
    };
  }, [activeIndex, segments.length]); // Intentionally omitting speakCurrentSlide to avoid re-triggering on its deps

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePageSelected = (e: any) => {
    const newIndex = e.nativeEvent.position;
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      stateRef.current.currentSegmentProgress = 0;
      saveProgress();
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await Speech.pause();
      setIsPlaying(false);
      setIsPausedState(true);
      stateRef.current.isPlaying = false;
      saveProgress(true);
    } else {
      if (isPausedState) {
        await Speech.resume();
        setIsPlaying(true);
        setIsPausedState(false);
        stateRef.current.isPlaying = true;
      } else {
        await speakCurrentSlide(stateRef.current.currentSegmentProgress);
      }
    }
  };

  const handleDoubleClick = () => {
    setBackgroundUrlIndex((prev) => (prev + 1) % videoSources.length);
  };

  let lastTap: number | null = null;
  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      handleDoubleClick();
    } else {
      togglePlayback();
    }
    lastTap = now;
  };

  if (segments.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-xl">Upload a PDF to see the feed!</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <SafeAreaView style={{position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40}} edges={['top']}>
        <View className="p-4 flex-row items-center justify-between pointer-events-none">
          <Pressable
            testID="back-button"
            onPress={() => { stopTTS(); router.back(); }}
            className="w-12 h-12 rounded-full items-center justify-center bg-black/40 border border-white/15 pointer-events-auto"
          >
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>

          <View className="px-4 py-2 rounded-full bg-black/40 border border-white/15">
            <Text className="text-sm font-medium text-white/90">
              Short {activeIndex + 1} / {segments.length}
            </Text>
          </View>

          <Pressable
            className="w-12 h-12 rounded-full items-center justify-center bg-black/40 border border-white/15 pointer-events-auto"
          >
            <Feather name="more-horizontal" size={24} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>

      <Pressable className="flex-1" onPress={handleTap}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1, width, height }}
          initialPage={initialIndex}
          orientation="vertical"
          onPageSelected={handlePageSelected}
          overdrag={true}
        >
          {segments.map((segment, i) => {
            // Memory optimization: render only current, previous, and next slides
            const isNearActive = Math.abs(i - activeIndex) <= 1;

            if (!isNearActive) {
               return (
                 <View key={i} style={{ flex: 1, width, height, backgroundColor: 'black' }} />
               );
            }

            return (
              <View key={i} style={{ flex: 1, width, height }}>
                <FeedSlide
                  segment={segment}
                  isActive={i === activeIndex}
                  isPlaying={isPlaying}
                  currentCharIndex={i === activeIndex ? currentCharIndex : -1}
                  highlightEndIndex={i === activeIndex ? highlightEndIndex : undefined}
                  highlightStartIndex={i === activeIndex ? highlightStartIndex : undefined}
                  videoSource={videoSources[(backgroundUrlIndex + i) % videoSources.length].url}
                  isMuted={isMuted}
                />
              </View>
            );
          })}
        </PagerView>
      </Pressable>

      {/* Footer / Controls */}
      <View className="absolute bottom-10 left-0 w-full z-40 p-4 pointer-events-none flex-col items-center">
        <View className="w-full flex-row justify-start pb-4 pl-4 pointer-events-auto">
          <Pressable
            className="w-10 h-10 rounded-full items-center justify-center shadow-lg bg-[#00FF88]"
            onPress={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <Feather name="volume-x" size={20} color="black" />
            ) : (
              <Feather name="volume-2" size={20} color="black" />
            )}
          </Pressable>
        </View>

        {activeIndex === 0 && (
          <View className="items-center mb-8">
            <Feather name="chevron-up" size={32} color="#00FF66" className="animate-bounce" />
            <Text className="text-xs font-medium text-white/90 tracking-wide uppercase mt-1">
              Swipe up to continue
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
