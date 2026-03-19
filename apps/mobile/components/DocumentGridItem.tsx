import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FileText, MoreVertical } from 'lucide-react-native';

interface DocumentGridItemProps {
  document: {
    id: string;
    title: string;
    author?: string;
    addedAt: number;
    totalSegments?: number;
    currentSegmentLength?: number;
  };
  onPress: () => void;
  onOptionsPress: () => void;
}

export function DocumentGridItem({ document, onPress, onOptionsPress }: DocumentGridItemProps) {
  const progress = document.totalSegments
    ? (document.currentSegmentLength || 0) / document.totalSegments
    : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 m-2 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
      activeOpacity={0.7}
    >
      <View className="h-40 bg-gray-50 items-center justify-center relative">
        <FileText size={48} color="#94a3b8" />

        {progress > 0 && progress < 1 && (
          <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
            <View
              className="h-full bg-blue-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        )}
      </View>

      <View className="p-3">
        <View className="flex-row items-start justify-between">
          <Text className="text-sm font-semibold text-gray-900 mb-1 flex-1" numberOfLines={2}>
            {document.title}
          </Text>
          <TouchableOpacity
            onPress={onOptionsPress}
            className="ml-2 p-1"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <MoreVertical size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
        {document.author && (
          <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
            {document.author}
          </Text>
        )}
        <Text className="text-xs text-gray-400">
          {new Date(document.addedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}