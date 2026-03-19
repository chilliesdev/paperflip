import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FileText, MoreVertical } from 'lucide-react-native';

interface DocumentListItemProps {
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

export function DocumentListItem({ document, onPress, onOptionsPress }: DocumentListItemProps) {
  const progress = document.totalSegments
    ? (document.currentSegmentLength || 0) / document.totalSegments
    : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row p-4 mb-2 bg-white rounded-xl shadow-sm border border-gray-100 items-center justify-between"
      activeOpacity={0.7}
    >
      <View className="h-16 w-12 bg-gray-50 items-center justify-center rounded-md mr-4 relative border border-gray-200 overflow-hidden">
        <FileText size={24} color="#94a3b8" />
        {progress > 0 && progress < 1 && (
          <View className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <View
              className="h-full bg-blue-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        )}
      </View>

      <View className="flex-1 justify-center pr-4">
        <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={1}>
          {document.title}
        </Text>
        {document.author && (
          <Text className="text-sm text-gray-500 mb-1" numberOfLines={1}>
            {document.author}
          </Text>
        )}
        <Text className="text-xs text-gray-400">
          Added {new Date(document.addedAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onOptionsPress}
        className="p-2 -mr-2"
        hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
      >
        <MoreVertical size={20} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}