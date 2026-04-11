import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';

type VideoLengthDialProps = {
  value: number;
  onChange: (value: number) => void;
};

export function VideoLengthDial({ value, onChange }: VideoLengthDialProps) {
  const options = [60, 90, 180, 300];

  const rotation = useMemo(() => {
    switch (value) {
      case 60: return '-135deg';
      case 90: return '-45deg';
      case 180: return '45deg';
      case 300: return '135deg';
      default: return '-135deg';
    }
  }, [value]);

  const getLabel = (opt: number) => {
    if (opt < 120) return opt + 's';
    return (opt / 60) + 'm';
  };

  return (
    <View className="bg-brand-surface-dark/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      <View className="absolute top-0 right-0 p-4 opacity-50">
        <MaterialIcons name="timelapse" size={24} color="#00FF88" />
      </View>
      <Text className="font-bold text-lg mb-6 text-white">Video Length</Text>

      <View className="items-center justify-center relative py-2">
        <View className="w-48 h-48 rounded-full bg-brand-surface-dark relative items-center justify-center border border-white/5 overflow-hidden">

          {/* Dial Arc Background (Simplified gradient using background colors) */}
          <View className="absolute inset-0 items-center justify-center">
             <View
                className="w-full h-full rounded-full"
                style={{
                  transform: [{ rotate: rotation }],
                  backgroundColor: '#1a1a2e',
                  borderWidth: 20,
                  borderColor: '#00bfff',
                  borderBottomColor: 'transparent',
                  borderRightColor: 'transparent'
                }}
             />
          </View>

          {/* Inner Circle */}
          <View className="absolute inset-4 bg-brand-surface rounded-full items-center justify-center z-10 border border-white/5">
            <Text testID="duration-label" className="text-4xl font-black text-brand-secondary tracking-tighter">
              {getLabel(value)}
            </Text>
            <Text className="text-[10px] text-brand-text-muted uppercase tracking-widest mt-1">Duration</Text>
          </View>

          {/* Marker */}
          <View className="absolute inset-0 z-20 items-center" style={{ transform: [{ rotate: rotation }] }}>
             <View className="w-1 h-2 bg-brand-secondary rounded-full mt-2" style={{ shadowColor: '#00bfff', shadowOpacity: 1, shadowRadius: 8, elevation: 5 }} />
          </View>

        </View>

        {/* Labels */}
        <View className="w-full max-w-[200px] mt-6 flex-row justify-between px-2">
          {options.map(opt => (
            <Pressable key={opt} onPress={() => onChange(opt)}>
              <Text className={`text-xs font-medium ${value === opt ? 'text-brand-secondary font-bold' : 'text-brand-text-muted'}`}>
                {getLabel(opt)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
