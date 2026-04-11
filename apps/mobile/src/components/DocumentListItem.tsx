/* eslint-disable @typescript-eslint/no-explicit-any */
import { View, Text, Pressable, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';

type DocumentProps = {
  document: any;
  onShowOptions?: (document: any) => void;
};

export function DocumentListItem({ document, onShowOptions }: DocumentProps) {
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
    'text-brand-primary bg-brand-primary',
    'text-brand-secondary bg-brand-secondary',
    'text-purple-400 bg-purple-400',
    'text-yellow-400 bg-yellow-400',
    'text-pink-400 bg-pink-400',
  ];

  const hash = useMemo(() => {
    return document.documentId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  }, [document.documentId]);

  const iconName = icons[hash % icons.length];
  const colorClasses = colors[hash % colors.length].split(' ');
  const textColor = colorClasses[0];
  const bgColor = colorClasses[1];

  return (
    <View className="bg-brand-surface border border-white/5 rounded-xl overflow-hidden flex-row h-24 relative mb-3 w-full">
      <Link href={`/feed?id=${encodeURIComponent(document.documentId)}`} asChild>
        <Pressable className="flex-row flex-grow w-full">
          <View className="w-24 bg-brand-surface-dark relative flex-shrink-0 items-center justify-center">
            {document.thumbnailUri ? (
              <Image source={{ uri: document.thumbnailUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <MaterialIcons name={iconName} size={30} className={`${textColor} opacity-40`} color="white" />
            )}
          </View>

          <View className="p-3 flex-grow flex-col justify-center max-w-[65%]">
            <View>
              <Text className="font-bold text-sm text-white leading-tight mb-1" numberOfLines={1}>
                {document.documentId}
              </Text>
              <Text className="text-[10px] text-brand-text-muted">
                {document.totalSegments ?? (document.segments?.length || 0)} segments • PDF
              </Text>
            </View>
          </View>
        </Pressable>
      </Link>

      <Pressable
        testID="more-options-button"
        className="absolute right-0 h-full p-3 items-center justify-center z-10"
        onPress={(e) => {
          e.stopPropagation();
          onShowOptions?.(document);
        }}
      >
        <MaterialIcons name="more-vert" size={24} color="rgba(255,255,255,0.5)" />
      </Pressable>

      <View testID="progress-bar-container" className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <View className="w-full bg-white/5 h-1">
          <View className={`${bgColor} h-full`} style={{ width: `${progress}%` }} />
        </View>
      </View>
    </View>
  );
}
