/* eslint-disable @typescript-eslint/no-explicit-any */
import { View, Text, Pressable, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';

type DocumentProps = {
  document: any;
  onShowOptions?: (document: any) => void;
};

export function DocumentGridItem({ document, onShowOptions }: DocumentProps) {
  const progress = useMemo(() => {
    const totalSegments = document.totalSegments ?? (document.segments?.length || 0);
    if (totalSegments === 0) return 0;

    const currentIdx = document.currentSegmentIndex || 0;
    const currentProgress = document.currentSegmentProgress || 0;
    const currentSegmentLength = document.currentSegmentLength ?? (document.segments?.[currentIdx]?.length || 1);

    const segmentPercentage = currentProgress / (currentSegmentLength || 1);
    return Math.min(100, Math.round(((currentIdx + segmentPercentage) / totalSegments) * 100));
  }, [document]);

  const icons = ['science', 'history-edu', 'psychology', 'code', 'article', 'menu-book'] as const;
  const colors = [
    { text: 'text-brand-primary', bg: 'bg-brand-primary' },
    { text: 'text-brand-secondary', bg: 'bg-brand-secondary' },
    { text: 'text-purple-400', bg: 'bg-purple-400' },
    { text: 'text-yellow-400', bg: 'bg-yellow-400' },
    { text: 'text-pink-400', bg: 'bg-pink-400' },
  ];

  const hash = useMemo(() => {
    return document.documentId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  }, [document.documentId]);

  const iconName = icons[hash % icons.length];
  const colorObj = colors[hash % colors.length];

  return (
    <View className="bg-brand-surface border border-white/5 rounded-xl overflow-hidden flex-col h-48 mb-4 w-[48%] relative">
      <Link href={`/feed?id=${encodeURIComponent(document.documentId)}`} asChild>
        <Pressable className="flex-col h-full w-full">
          <View className="h-24 bg-brand-surface-dark relative items-center justify-center overflow-hidden">
            {document.thumbnailUri ? (
              <Image source={{ uri: document.thumbnailUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <MaterialIcons name={iconName} size={40} className={`${colorObj.text} opacity-40`} color="white" />
            )}
            <View className="absolute inset-0 bg-black/20 opacity-0" />
          </View>

          <View className="p-2 flex-grow flex-col justify-between">
            <View>
              <Text className="font-bold text-xs text-white leading-tight mb-1" numberOfLines={1}>
                {document.documentId}
              </Text>
              <Text className="text-[9px] text-brand-text-muted" numberOfLines={1}>
                {document.totalSegments ?? (document.segments?.length || 0)} Segments • PDF
              </Text>
            </View>
            <View className="mt-2">
              <View className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <View className={`${colorObj.bg} h-full rounded-full`} style={{ width: `${progress}%` }} />
              </View>
            </View>
          </View>
        </Pressable>
      </Link>

      <Pressable
        className="absolute top-1 right-1 p-2 rounded-full z-20"
        onPress={(e) => {
          e.stopPropagation();
          onShowOptions?.(document);
        }}
      >
        <MaterialIcons name="more-vert" size={20} color="rgba(255,255,255,0.5)" />
      </Pressable>
    </View>
  );
}
