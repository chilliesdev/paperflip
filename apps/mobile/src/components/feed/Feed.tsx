import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { splitSentences } from '@paperflip/core';
import { videoSources } from '@paperflip/core';
import { updateDocumentProgress, getSettings, updateSettings } from '@paperflip/core';
import { FeedSlide } from './FeedSlide';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReadingOptionsSheet } from '../ReadingOptionsSheet';

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
  const scrollRef = useRef<ScrollView>(null);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [currentCharIndex, setCurrentCharIndex] = useState(-1);
  const [highlightEndIndex, setHighlightEndIndex] = useState<number | undefined>(undefined);
  const [highlightStartIndex, setHighlightStartIndex] = useState<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [backgroundUrlIndex, setBackgroundUrlIndex] = useState(0);

  const [isDictationMode, setIsDictationMode] = useState(Platform.OS === 'android');

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [karaokeMode, setKaraokeMode] = useState(true);

  // Ref for mutable state that doesn't need to trigger re-renders but is accessed in callbacks
  const stateRef = useRef({
    currentCharIndex: -1,
    currentSegmentProgress: 0,
    isPlaying: false,
    boundaryFired: false,
    lastTap: 0,
  });

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundaryCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSettings().then(s => {
      console.log('[Feed] Settings loaded:', s);
      if (s.playbackSpeed) setPlaybackRate(s.playbackSpeed);
      if (s.autoScroll !== undefined) setAutoScroll(s.autoScroll);
      if (s.karaokeMode !== undefined) setKaraokeMode(s.karaokeMode);
    }).catch(console.error);
  }, []);

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
    console.log('[Feed] stopTTS called');
    await Speech.stop();
    // On some Android devices, stop() takes a moment to actually release the resource
    if (Platform.OS === 'android') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    stateRef.current.isPlaying = false;
    setIsPlaying(false);
  }, []);

  const speakDictation = useCallback(async (text: string, startIndex: number) => {
    console.log(`[Feed] speakDictation starting from ${startIndex}`);
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      console.log('[Feed] Speech engine busy, waiting...');
      await stopTTS();
    }
    const sentences = splitSentences(text);
    console.log(`[Feed] splitSentences found ${sentences.length} sentences`);
    const sentenceQueue = sentences.filter((s) => s.end > startIndex);

    const playNextSentence = async (queue: typeof sentences, originalStartIndex: number) => {
      if (queue.length === 0 || !stateRef.current.isPlaying) {
        console.log(`[Feed] playNextSentence finished or stopped. Queue: ${queue.length}, isPlaying: ${stateRef.current.isPlaying}`);
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
      const textToSpeak = (offset > 0 ? currentSentence.text.substring(offset) : currentSentence.text).trim();

      if (!textToSpeak) {
        playNextSentence(remaining, 0);
        return;
      }

      console.log(`[Feed] Speaking sentence: "${textToSpeak.substring(0, 30)}..."`);
      try {
        Speech.speak(textToSpeak, {
          onDone: () => {
            console.log(`[Feed] Sentence done`);
            if (!stateRef.current.isPlaying) return;
            playNextSentence(remaining, 0);
          },
          onError: (err) => {
            console.error(`[Feed] Speech error:`, err);
            setIsPlaying(false);
            stateRef.current.isPlaying = false;
          },
          rate: playbackRate
        });
      } catch (err) {
        console.error(`[Feed] Speech.speak sync throw:`, err);
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
      }
    };

    stateRef.current.isPlaying = true;
    setIsPlaying(true);
    playNextSentence(sentenceQueue, startIndex);

  }, [segments, activeIndex, saveProgress, playbackRate, stopTTS]);

  const speakKaraoke = useCallback(async (text: string, startIndex: number) => {
    stateRef.current.boundaryFired = false;
    stateRef.current.isPlaying = true;
    setIsPlaying(true);

    const voiceOptions: Speech.SpeechOptions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      onError: (err) => {
        console.error('[Feed] Karaoke speech error:', err);
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
      },
      rate: playbackRate
    };

    // React Native Expo Speech boundary events are notoriously unreliable across Android/iOS.
    // We add a boundary check fallback similar to web, forcing Dictation mode if not working.
    boundaryCheckTimeout.current = setTimeout(() => {
      if (!stateRef.current.boundaryFired && stateRef.current.isPlaying) {
        console.warn("Boundary events missing or slow, switching to Dictation Mode");
        stopTTS().then(() => {
          setIsDictationMode(true);
          // Auto-restart in dictation mode
          const currentSegment = segments[activeIndex];
          if (currentSegment) {
            speakDictation(currentSegment, stateRef.current.currentSegmentProgress);
          }
        });
      }
    }, 5000);

    // If there's an offset, some platforms don't support it natively for TTS.
    const textToSpeak = startIndex > 0 ? text.substring(startIndex) : text;
    Speech.speak(textToSpeak, voiceOptions);

  }, [saveProgress, stopTTS, playbackRate, segments, activeIndex, speakDictation]);


  const speakCurrentSlide = useCallback(async (overrideStartIndex?: number) => {
    console.log(`[Feed] speakCurrentSlide called, index: ${activeIndex}, overrideStart: ${overrideStartIndex}`);
    await stopTTS();
    if (boundaryCheckTimeout.current) clearTimeout(boundaryCheckTimeout.current);

    setCurrentCharIndex(-1);
    setHighlightEndIndex(undefined);
    setHighlightStartIndex(undefined);

    let startIndex = overrideStartIndex ?? 0;

    // For initial load
    if (overrideStartIndex === undefined && activeIndex === initialIndex && initialProgress > 0) {
      startIndex = initialProgress;
    }

    setCurrentCharIndex(startIndex);
    stateRef.current.currentSegmentProgress = startIndex;
    stateRef.current.currentCharIndex = startIndex;

    const currentSegment = segments[activeIndex];
    if (!currentSegment) {
      console.warn(`[Feed] No segment found at index ${activeIndex}`);
      return;
    }

    // Use current state settings
    const modeDictation = isDictationMode || !karaokeMode;
    console.log(`[Feed] Mode: ${modeDictation ? 'Dictation' : 'Karaoke'}`);

    if (modeDictation) {
      await speakDictation(currentSegment, startIndex);
    } else {
      await speakKaraoke(currentSegment, startIndex);
    }
  }, [activeIndex, initialIndex, initialProgress, segments, isDictationMode, karaokeMode, speakDictation, speakKaraoke, stopTTS]);


  useEffect(() => {
    // Component mount or activeIndex change
    if (segments.length > 0) {
      console.log(`[Feed] Starting mountTimeout for index ${activeIndex}`);
      // Small delay to ensure ScrollView has settled if not on index 0
      mountTimeout.current = (setTimeout(() => {
         speakCurrentSlide();
      }, 500) as unknown as ReturnType<typeof setTimeout>);
    }

    return () => {
      console.log(`[Feed] Cleanup for index ${activeIndex}`);
      stopTTS();
      if (boundaryCheckTimeout.current) clearTimeout(boundaryCheckTimeout.current);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (mountTimeout.current) clearTimeout(mountTimeout.current);
      saveProgress(true);
    };
  }, [activeIndex, segments.length, speakCurrentSlide]);

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    updateSettings({ playbackSpeed: rate });
    if (stateRef.current.isPlaying) {
      speakCurrentSlide();
    }
  };

  const handleAutoScrollToggle = () => {
    const newValue = !autoScroll;
    setAutoScroll(newValue);
    updateSettings({ autoScroll: newValue });
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.y / height);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      stateRef.current.currentSegmentProgress = 0;
      saveProgress();
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      console.log('[Feed] togglePlayback: pausing');
      if (Platform.OS === 'android') {
        await Speech.stop();
      } else {
        await Speech.pause();
      }
      setIsPlaying(false);
      setIsPausedState(true);
      stateRef.current.isPlaying = false;
      saveProgress(true);
    } else {
      console.log('[Feed] togglePlayback: playing');
      if (isPausedState) {
        if (Platform.OS === 'android') {
          await speakCurrentSlide(stateRef.current.currentSegmentProgress);
        } else {
          await Speech.resume();
        }
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

  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (stateRef.current.lastTap && (now - stateRef.current.lastTap) < DOUBLE_PRESS_DELAY) {
      handleDoubleClick();
    } else {
      togglePlayback();
    }
    stateRef.current.lastTap = now;
  }, [togglePlayback]);

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
        <View className="p-4 flex-row items-center justify-between pointer-events-box-none">
          <Pressable
            testID="back-button"
            onPress={() => { stopTTS(); router.back(); }}
            className="w-12 h-12 rounded-full items-center justify-center bg-black/40 border border-white/15"
          >
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>

          <View className="px-4 py-2 rounded-full bg-black/40 border border-white/15">
            <Text className="text-sm font-medium text-white/90">
              Short {activeIndex + 1} / {segments.length}
            </Text>
          </View>

          <Pressable
            onPress={() => setOptionsVisible(true)}
            className="w-12 h-12 rounded-full items-center justify-center bg-black/40 border border-white/15"
          >
            <Feather name="more-horizontal" size={24} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, width, height }}
        contentOffset={{ x: 0, y: activeIndex * height }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEnabled={true}
      >
        {segments.map((segment, i) => {
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
                onPress={handleTap}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Footer / Controls */}
      <View className="absolute bottom-10 left-0 w-full z-40 p-4 pointer-events-box-none flex-col items-center">
        <View className="w-full flex-row justify-start pb-4 pl-4">
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

      <ReadingOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        playbackRate={playbackRate}
        onPlaybackRateChange={handlePlaybackRateChange}
        autoScroll={autoScroll}
        onAutoScrollToggle={handleAutoScrollToggle}
      />
    </View>
  );
}
