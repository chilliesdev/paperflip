import { View, Text, Switch, StyleSheet } from 'react-native';

interface ToggleTileProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ToggleTile({ label, description, value, onValueChange }: ToggleTileProps) {
  return (
    <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100">
      <View className="flex-1 pr-4">
        <Text className="text-base font-semibold text-gray-900">{label}</Text>
        <Text className="text-sm text-gray-500 mt-1">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
        thumbColor={value ? '#ffffff' : '#ffffff'}
      />
    </View>
  );
}