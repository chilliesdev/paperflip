import { Tabs } from 'expo-router';
import { BottomNavigation } from '../src/components/BottomNavigation';
import { View } from 'react-native';

export default function Layout() {
  return (

      <View className="flex-1 bg-brand-bg">
        <Tabs tabBar={() => <BottomNavigation />} screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="library" />
          <Tabs.Screen name="settings" />
        </Tabs>
      </View>

  );
}
