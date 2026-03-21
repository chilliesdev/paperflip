import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type ToggleTileProps = {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function ToggleTile({ title, description, icon, checked, onChange, disabled }: ToggleTileProps) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      className={`rounded-2xl p-4 flex-col justify-between h-32 flex-1 overflow-hidden ${
        checked ? 'bg-brand-surface-dark/70 border border-[#00FF88]/30' : 'bg-brand-surface-dark/40 border border-white/5'
      }`}
    >
      <View className="flex-row justify-between items-start">
        <View className={`p-2 rounded-lg ${checked ? 'bg-brand-primary/10' : 'bg-white/5'}`}>
          <MaterialIcons name={icon} size={24} color={checked ? '#00FF88' : '#888'} />
        </View>

        {/* Custom Switch */}
        <View className={`w-10 h-5 rounded-full justify-center p-0.5 ${checked ? 'bg-brand-primary/30 border border-brand-primary' : 'bg-white/10 border border-white/20'}`}>
          <View className={`w-4 h-4 rounded-full bg-white ${checked ? 'ml-auto shadow-[0_0_10px_rgba(0,255,136,0.5)]' : 'mr-auto'}`} />
        </View>
      </View>

      <View>
        <Text className={`font-bold text-sm ${checked ? 'text-white' : 'text-brand-text-muted'}`}>
          {title}
        </Text>
        <Text className="text-[10px] text-brand-text-muted mt-1 leading-tight">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
