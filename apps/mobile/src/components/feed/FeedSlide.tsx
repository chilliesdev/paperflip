import React, { useMemo, useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { splitSentences } from '@paperflip/core';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface FeedSlideProps {
  segment: string;
  isActive: boolean;
  isPlaying: boolean;
  currentCharIndex: number;
  highlightEndIndex?: number;
  highlightStartIndex?: number;
  videoSource: string;
  textScale?: number;
  isMuted?: boolean;
}

export function FeedSlide({
  segment = '',
  isActive,
  isPlaying = true,
  currentCharIndex,
  highlightEndIndex,
  highlightStartIndex,
  videoSource,
  textScale = 100,
  isMuted = true,
}: FeedSlideProps) {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
    if (isActive && isPlaying) {
      p.play();
    }
  });

  useEffect(() => {
    if (isActive && isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, isActive, isPlaying]);

  useEffect(() => {
    player.muted = isMuted;
  }, [player, isMuted]);

  const words = useMemo(() => {
    if (!segment) return [];
    const w: { word: string; start: number; end: number }[] = [];
    const wordRegex = /\S+/g;
    let match;
    while ((match = wordRegex.exec(segment)) !== null) {
      w.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return w;
  }, [segment]);

  const sentences = useMemo(() => {
    if (!segment) return [];
    return splitSentences(segment);
  }, [segment]);

  const currentSentence = useMemo(() => {
    if (currentCharIndex === -1 || !isActive) {
      return sentences.length > 0 ? sentences[0] : null;
    }
    const found = sentences.find(
      (s) => currentCharIndex >= s.start && currentCharIndex < s.end
    );
    if (found) return found;

    if (sentences.length === 0) return null;
    if (currentCharIndex < sentences[0].start) return sentences[0];
    if (currentCharIndex >= sentences[sentences.length - 1].end)
      return sentences[sentences.length - 1];

    let prev;
    for (let i = sentences.length - 1; i >= 0; i--) {
      if (sentences[i].start <= currentCharIndex) {
        prev = sentences[i];
        break;
      }
    }
    return prev || sentences[0];
  }, [sentences, currentCharIndex, isActive]);

  const visibleWords = useMemo(() => {
    const result = [];
    if (highlightEndIndex !== undefined) {
      const startIndex = highlightStartIndex ?? currentCharIndex;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (w.start >= startIndex && w.end <= highlightEndIndex) {
          result.push(w);
        }
      }
    } else {
      if (!currentSentence) return words;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (w.start >= currentSentence.start && w.end <= currentSentence.end) {
          result.push(w);
        }
      }
    }
    return result;
  }, [words, highlightEndIndex, highlightStartIndex, currentCharIndex, currentSentence]);

  // Progress based on character index for smoother animation
  const progress = useMemo(() => {
    return segment.length > 0
      ? Math.min(100, (Math.max(0, currentCharIndex) / segment.length) * 100)
      : 0;
  }, [segment, currentCharIndex]);

  const renderWord = (w: typeof words[0], index: number) => {
    const isDictation = highlightEndIndex !== undefined;
    const active = isDictation
      ? w.start >= currentCharIndex && w.end <= (highlightEndIndex ?? 0)
      : currentCharIndex >= w.start && currentCharIndex < w.end;
    const past = w.end <= currentCharIndex;

    let textColorClass = 'text-white/50';
    if (active) {
      textColorClass = 'text-[#00FF88] font-bold'; // text-brand-primary equivalent
    } else if (past) {
      textColorClass = 'text-white/80';
    }

    // Applying scale style via inline styles as NativeWind arbitrary classes might be tricky in text.
    // However, tailwind supports `text-white/50` generally. Let's use standard className text coloring and inline styles for transforms.

    return (
      <Text
        key={`${w.start}-${index}`}
        className={`inline-block text-center ${textColorClass} ${active ? 'mx-1.5' : 'mx-[2px]'}`}
        style={{
          fontSize: (textScale / 100) * 24, // Base size ~24px
          lineHeight: (textScale / 100) * 36,
          textShadowColor: active ? '#00FF88' : 'transparent',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: active ? 12 : 0,
          transform: [{ scale: active ? 1.1 : 1 }],
        }}
      >
        {w.word}{' '}
      </Text>
    );
  };

  return (
    <View className="flex-1 bg-black relative overflow-hidden" style={{ width, height }}>
      <View className="absolute inset-0 z-0">
        <VideoView
          player={player}
          className="w-full h-full opacity-80"
          contentFit="cover"
          nativeControls={false}
        />
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(88, 28, 135, 0.4)', 'rgba(30, 58, 138, 0.4)', 'rgba(19, 78, 74, 0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <View className="relative z-10 flex-1 flex-col justify-center px-8 py-20 pointer-events-none">
        <View className="bg-black/60 rounded-2xl px-6 py-8 border border-white/10 shadow-xl max-w-[90%] mx-auto overflow-hidden">
            {/* Blur backdrop is tricky without expo-blur, using a solid transparent color instead for RN compatibility */}
          <Text
            className="text-center font-medium leading-relaxed"
            style={{ fontSize: (textScale / 100) * 24 }}
          >
            {visibleWords.map((w, i) => renderWord(w, i))}
          </Text>
        </View>
      </View>

      {/* Progress Bar (simplified for mobile without scrubbing for now, matching simple playback progress) */}
      <View className="absolute bottom-0 left-0 right-0 z-30 h-2 flex items-end">
        <View className="w-full h-1 bg-white/10">
          <View
            testID="progress-bar"
            className="h-full bg-[#00FF88]"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    </View>
  );
}
