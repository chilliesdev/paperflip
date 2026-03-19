import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

interface TextScaleSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
}

export function TextScaleSlider({
  value,
  onValueChange,
  minValue = 1,
  maxValue = 3
}: TextScaleSliderProps) {
  return (
    <View className="px-4 py-4 bg-white border-b border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-gray-900">Text Size</Text>
        <Text className="text-sm font-medium text-blue-500">{value.toFixed(1)}x</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-500 mr-2">A</Text>
        <Slider
          className="flex-1"
          minimumValue={minValue}
          maximumValue={maxValue}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor="#3b82f6"
          maximumTrackTintColor="#e2e8f0"
          thumbTintColor="#3b82f6"
          step={0.1}
        />
        <Text className="text-lg font-bold text-gray-500 ml-2">A</Text>
      </View>
    </View>
  );
}