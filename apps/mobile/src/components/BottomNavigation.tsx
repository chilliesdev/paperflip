import { Link, usePathname } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (pathname.includes('/feed')) return null;

  return (
    <View className="absolute bottom-0 w-full z-20">
      <BlurView
        intensity={80}
        tint="dark"
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 16) }
        ]}
      >
        <View className="flex-row items-center justify-between px-6 flex w-full">
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
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  }
});
