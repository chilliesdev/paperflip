import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import './global.css';

// Import from workspace core package
import { DEFAULT_SETTINGS, setDbStorage, getDb } from '@paperflip/core';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

// Setup DB Storage for mobile (using memory storage for verification purposes)
setDbStorage(getRxStorageMemory(), true);

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((err) => setDbError(err.message));
  }, []);

  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
