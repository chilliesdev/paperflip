import { Tabs } from 'expo-router';
import { BottomNavigation } from '../src/components/BottomNavigation';
import { View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStorageEngine, type StorageEngine } from '@paperflip/core';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

// Barebones storage engine for Mobile and Web
const memoryFallback = new Map<string, string>();
let useMemoryFallback = false;

const mobileStorage: StorageEngine = {
  get: async (key) => {
    try {
      if (Platform.OS === 'web') {
        const val = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        return val ? JSON.parse(val) : null;
      }

      if (!useMemoryFallback) {
        try {
          const val = await AsyncStorage.getItem(key);
          return val ? JSON.parse(val) : null;
        } catch (e: any) {
          if (e?.message?.includes('Native module is null')) {
            useMemoryFallback = true;
            console.warn('AsyncStorage native module is null. Falling back to in-memory storage for this session. Data will not persist.');
          } else {
            throw e;
          }
        }
      }

      const memVal = memoryFallback.get(key);
      return memVal ? JSON.parse(memVal) : null;
    } catch (e) {
      console.error(`Error getting key ${key} from storage:`, e);
      return null;
    }
  },
  set: async (key, value) => {
    try {
      const stringified = JSON.stringify(value);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, stringified);
        }
        return;
      }

      if (!useMemoryFallback) {
        try {
          await AsyncStorage.setItem(key, stringified);
          return;
        } catch (e: any) {
          if (e?.message?.includes('Native module is null')) {
            useMemoryFallback = true;
          } else {
            throw e;
          }
        }
      }

      memoryFallback.set(key, stringified);
    } catch (e) {
      console.error(`Error setting key ${key} in storage:`, e);
    }
  },
  del: async (key) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return;
      }

      if (!useMemoryFallback) {
        try {
          await AsyncStorage.removeItem(key);
          return;
        } catch (e: any) {
          if (e?.message?.includes('Native module is null')) {
            useMemoryFallback = true;
          } else {
            throw e;
          }
        }
      }

      memoryFallback.delete(key);
    } catch (e) {
      console.error(`Error deleting key ${key} from storage:`, e);
    }
  },
  keys: async () => {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? Object.keys(window.localStorage) : [];
      }

      if (!useMemoryFallback) {
        try {
          const keys = await AsyncStorage.getAllKeys();
          return (keys || []) as string[];
        } catch (e: any) {
          if (e?.message?.includes('Native module is null')) {
            useMemoryFallback = true;
          } else {
            throw e;
          }
        }
      }

      return Array.from(memoryFallback.keys());
    } catch (e) {
      console.error('Error getting all keys from storage:', e);
      return [];
    }
  },
};

// Initialize the storage engine for mobile
setStorageEngine(mobileStorage);

export default function Layout() {
  useEffect(() => {
    // Hide the splash screen once the initial render is done
    SplashScreen.hideAsync().catch(() => {
      /* ignore error */
    });
  }, []);

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
