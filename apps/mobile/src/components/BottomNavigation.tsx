import { Link, usePathname } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <View className="absolute bottom-0 w-full px-6 pt-2 pb-8 bg-brand-surface-dark/90 border-t border-white/5 z-20">
      <View className="flex-row items-center justify-between px-10">
        <Link href="/" asChild>
          <Pressable className="flex-col items-center space-y-1">
            <MaterialIcons name="home" size={24} color={pathname === '/' ? '#00FF88' : '#888'} />
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/' ? 'text-brand-primary' : 'text-brand-text-muted'}`}>Home</Text>
          </Pressable>
        </Link>
        <Link href="/library" asChild>
          <Pressable className="flex-col items-center space-y-1">
            <MaterialIcons name="auto-stories" size={24} color={pathname === '/library' ? '#00FF88' : '#888'} />
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/library' ? 'text-brand-primary' : 'text-brand-text-muted'}`}>Library</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable className="flex-col items-center space-y-1">
            <MaterialIcons name="settings" size={24} color={pathname === '/settings' ? '#00FF88' : '#888'} />
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${pathname === '/settings' ? 'text-brand-primary' : 'text-brand-text-muted'}`}>Settings</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
