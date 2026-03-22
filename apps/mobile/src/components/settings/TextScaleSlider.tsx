import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type TextScaleSliderProps = {
  scale: number;
  onChange: (scale: number) => void;
};

export function TextScaleSlider({ scale, onChange }: TextScaleSliderProps) {
  // Mock slider for now since pure RN doesn't have a great native slider out of the box without community
  // We'll use a simple + and - button approach or standard primitive if needed.
  // Actually, we can just build a custom pressable track or use +/- for simplicity to avoid installing new deps.

  const increment = () => onChange(Math.min(150, scale + 10));
  const decrement = () => onChange(Math.max(80, scale - 10));

  return (
    <View className="bg-brand-surface-dark/40 border border-white/5 rounded-2xl p-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-bold text-lg text-white">Text Scale</Text>
        <Text className="text-xs font-mono text-brand-secondary">{scale}%</Text>
      </View>

      <View className="h-16 flex-row items-center justify-center bg-brand-surface-dark/50 rounded-lg mb-4 border border-white/5 overflow-hidden px-4">
        <Text
          style={{ fontSize: 16 * (scale / 100) }}
          className="text-white/90 leading-snug text-center"
          numberOfLines={1}
        >
          The quick brown fox jumps...
        </Text>
      </View>

      <View className="flex-row items-center space-x-3 justify-between">
        <Pressable onPress={decrement} className="p-2 bg-white/10 rounded-full">
          <MaterialIcons name="remove" size={24} color="#888" />
        </Pressable>

        <View className="flex-1 h-1 bg-white/10 mx-4 rounded-lg overflow-hidden relative">
          <View
            className="absolute left-0 top-0 bottom-0 bg-[#00FF88]"
            style={{ width: `${((scale - 80) / (150 - 80)) * 100}%` }}
          />
        </View>

        <Pressable onPress={increment} className="p-2 bg-white/10 rounded-full">
          <MaterialIcons name="add" size={24} color="#00FF88" />
        </Pressable>
      </View>
    </View>
  );
}
