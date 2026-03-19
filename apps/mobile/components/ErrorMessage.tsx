import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';

interface ErrorMessageProps {
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ title, message, onDismiss }: ErrorMessageProps) {
  return (
    <View className="flex-row items-start p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm mx-4 my-2">
      <View className="mr-3 mt-0.5">
        <AlertCircle size={24} color="#ef4444" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-red-800 mb-1">{title}</Text>
        <Text className="text-sm text-red-700 leading-relaxed">{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          className="ml-2 p-1"
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <X size={20} color="#f87171" />
        </TouchableOpacity>
      )}
    </View>
  );
}