import { View, Text, TouchableOpacity } from 'react-native';
import { Upload } from 'lucide-react-native';

interface LibraryHeaderProps {
  onUploadPress: () => void;
}

export function LibraryHeader({ onUploadPress }: LibraryHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-6 bg-white border-b border-gray-100">
      <View>
        <Text className="text-3xl font-bold text-gray-900">Library</Text>
        <Text className="text-sm text-gray-500 mt-1">Your reading list</Text>
      </View>
      <TouchableOpacity
        onPress={onUploadPress}
        className="bg-blue-500 p-3 rounded-full shadow-sm"
        activeOpacity={0.8}
      >
        <Upload color="#ffffff" size={24} />
      </TouchableOpacity>
    </View>
  );
}