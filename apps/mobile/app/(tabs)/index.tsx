import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { DEFAULT_SETTINGS, setDbStorage, getDb } from '@paperflip/core';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

// In a real app we would use SQLite storage adapter but for the sake of the environment
// and the fact rxdb-premium fails to install without a license key, we'll use memory storage.
setDbStorage(getRxStorageMemory(), true);

export default function LibraryScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Database initialization error:', err);
        setDbError(err.message);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text className="text-2xl font-bold text-blue-500 mb-4">Library</Text>

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