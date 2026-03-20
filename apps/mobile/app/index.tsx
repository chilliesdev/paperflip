import { Platform } from 'react-native';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
if (Platform.OS === 'web') {
  try {
    const { StyleSheet } = require('react-native-css-interop');
    if (StyleSheet.setFlag) {
      StyleSheet.setFlag('darkMode', 'class');
    }
  } catch {
    // Ignore error
  }
}

import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import '../global.css';

// Polyfill crypto.subtle.digest for RxDB and other libraries
if (typeof global.crypto === 'undefined') {
  Object.assign(global, { crypto: {} });
}
if (typeof (global as { crypto: { subtle?: any } }).crypto.subtle === 'undefined') {
  (global as { crypto: { subtle?: any } }).crypto.subtle = {
    digest: async (_algorithm: string, data: Uint8Array | ArrayBuffer | string) => {
      let str: string;
      if (typeof data === 'string') {
        str = data;
      } else {
        const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
        str = Array.from(uint8)
          .map((b) => String.fromCharCode(b))
          .join('');
      }

      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        str
      );

      const hexToBuf = (hex: string) => {
        const view = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return view.buffer;
      };
      return hexToBuf(hash);
    },
  };
}

// Import from workspace core package
import { DEFAULT_SETTINGS, setDbStorage, getDb } from '@paperflip/core';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

// Setup DB Storage for mobile (using memory storage for verification purposes)
setDbStorage(getRxStorageMemory(), true, async (data: string | Uint8Array) => {
  if (typeof data === 'string') {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
  } else {
    const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
    const str = Array.from(uint8)
      .map((b) => String.fromCharCode(b))
      .join('');
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      str
    );
  }
});

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('getDb error', err);
        setDbError(err.message);
      });
  }, []);

  return (
    <View className="flex-1 bg-brand-bg items-center justify-center">
      <Text className="text-2xl font-bold text-blue-500 mb-4">Paperflip Mobile</Text>

      <Text className="text-lg text-gray-700 mb-2">Core Settings Verification:</Text>
      <View className="bg-gray-100 p-4 rounded-lg w-4/5 items-center mb-6">
        <Text className="text-sm font-mono text-green-600">
          Default Video Length: {DEFAULT_SETTINGS.videoLength}s
        </Text>
        <Text className="text-sm font-mono text-green-600">
          Karaoke Mode: {DEFAULT_SETTINGS.karaokeMode ? 'Enabled' : 'Disabled'}
        </Text>
      </View>

      <Text className="text-lg text-gray-700 mb-2">Core DB Verification:</Text>
      <View className="bg-gray-100 p-4 rounded-lg w-4/5 items-center">
        {dbError ? (
          <Text className="text-sm font-mono text-red-600">DB Error: {dbError}</Text>
        ) : dbReady ? (
          <Text className="text-sm font-mono text-green-600">DB Initialized Successfully!</Text>
        ) : (
          <Text className="text-sm font-mono text-yellow-600">Initializing DB...</Text>
        )}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}
