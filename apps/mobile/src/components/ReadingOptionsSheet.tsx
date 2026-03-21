import { View, Text, Pressable, Modal } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

type ReadingOptionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  autoScroll: boolean;
  onAutoScrollToggle: () => void;
};

export function ReadingOptionsSheet({
  visible,
  onClose,
  playbackRate,
  onPlaybackRateChange,
  autoScroll,
  onAutoScrollToggle
}: ReadingOptionsSheetProps) {

  const rates = [0.5, 1.0, 1.5, 2.0];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
        />

        {/* Sheet Content */}
        <View className="bg-[#0f0f1e] border-t border-white/10 rounded-t-3xl pb-10 pt-2 px-6 shadow-2xl">

          {/* Handle */}
          <Pressable className="w-full items-center py-4" onPress={onClose}>
            <View className="w-12 h-1.5 bg-white/20 rounded-full" />
          </Pressable>

          <View className="flex-col space-y-6 pb-6">

            {/* Adjust Speed */}
            <View className="flex-col space-y-4">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-brand-surface border border-white/10 items-center justify-center mr-4">
                  <MaterialIcons name="speed" size={24} color="#00bfff" />
                </View>
                <Text className="text-white font-semibold text-lg">Adjust Speed</Text>
              </View>

              <View className="flex-row items-center justify-between bg-brand-surface/50 rounded-xl p-1 border border-white/5">
                {rates.map(rate => (
                  <Pressable
                    key={rate}
                    className={`flex-1 py-2 rounded-lg items-center ${playbackRate === rate ? 'bg-brand-primary shadow-lg scale-105' : 'hover:bg-white/5'}`}
                    onPress={() => onPlaybackRateChange(rate)}
                  >
                    <Text className={`text-sm font-medium ${playbackRate === rate ? 'text-brand-bg font-bold' : 'text-brand-text-muted'}`}>
                      {rate}x
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="h-px w-full bg-white/5 my-4" />

            {/* Auto Scroll */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-brand-surface border border-white/10 items-center justify-center mr-4">
                  <Feather name="arrow-up" size={24} color="#00FF88" />
                </View>
                <Text className="text-white font-semibold text-lg">Auto Scroll</Text>
              </View>

              {/* Toggle Switch */}
              <Pressable
                onPress={onAutoScrollToggle}
                className={`h-6 w-11 rounded-full justify-center px-0.5 ${autoScroll ? 'bg-brand-primary' : 'bg-gray-700'}`}
              >
                <View
                  className={`h-4 w-4 rounded-full bg-white ${autoScroll ? 'ml-auto' : 'mr-auto'}`}
                />
              </Pressable>
            </View>

            <View className="pt-2 items-center">
              <Text className="text-xs text-brand-text-muted">
                Reading settings apply to all documents
              </Text>
            </View>

          </View>

        </View>
      </View>
    </Modal>
  );
}
