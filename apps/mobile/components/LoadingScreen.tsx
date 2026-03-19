import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  progress?: number;
}

export function LoadingScreen({ message = 'Loading...', subMessage, progress }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <ActivityIndicator size="large" color="#3b82f6" className="mb-6" />
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{message}</Text>

      {subMessage && (
        <Text className="text-base text-gray-500 text-center mb-6 px-4">{subMessage}</Text>
      )}

      {progress !== undefined && (
        <View className="w-full max-w-xs mt-4">
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </View>
          <Text className="text-sm font-medium text-gray-500 mt-2 text-center">
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}