import { View, Text, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type LibraryHeaderProps = {
  searchQuery: string;
  onSearchChange: (text: string) => void;
};

export function LibraryHeader({ searchQuery, onSearchChange }: LibraryHeaderProps) {
  return (
    <View className="pt-6 pb-6 px-6">
      <View className="flex-row items-center">
        <Text className="text-3xl font-extrabold tracking-tight text-white">My</Text>
        <Text className="text-3xl font-extrabold tracking-tight text-brand-primary ml-2">Library</Text>
      </View>

      <View className="mt-4 relative justify-center">
        <View className="absolute left-3 z-10 h-full justify-center">
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.5)" />
        </View>
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search your stories..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          className="w-full bg-brand-surface/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white"
        />
      </View>
    </View>
  );
}
