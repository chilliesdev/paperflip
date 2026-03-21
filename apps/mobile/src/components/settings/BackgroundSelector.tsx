import { View, Text, Pressable, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { videoSources } from '@paperflip/core';

type BackgroundSelectorProps = {
  selected: string;
  onChange: (url: string) => void;
};

export function BackgroundSelector({ selected, onChange }: BackgroundSelectorProps) {
  return (
    <View className="bg-brand-surface-dark/40 border border-white/5 rounded-2xl p-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-bold text-lg text-white">Background</Text>
        <Text className="text-xs font-bold text-brand-primary uppercase tracking-wider">
          View All
        </Text>
      </View>
      <View className="flex-row space-x-3">
        {videoSources.map((bg) => {
          const isSelected = selected === bg.url;
          return (
            <Pressable
              key={bg.url}
              onPress={() => onChange(bg.url)}
              className={`flex-1 aspect-square rounded-xl overflow-hidden relative ${
                isSelected ? 'border-2 border-brand-primary' : 'border border-white/10 opacity-70'
              }`}
            >
              {isSelected && <View className="absolute inset-0 bg-brand-primary/20 z-10" />}
              <Image
                source={{ uri: bg.previewUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              {isSelected && (
                <View className="absolute bottom-1 right-1 z-20 bg-black/60 rounded-full p-0.5">
                  <MaterialIcons name="check" size={14} color="#00FF88" />
                </View>
              )}
            </Pressable>
          );
        })}

        <Pressable className="flex-1 aspect-square rounded-xl bg-brand-surface-dark border border-white/10 items-center justify-center">
          <MaterialIcons name="add-photo-alternate" size={24} color="#888" />
        </Pressable>
      </View>
    </View>
  );
}
