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

// Ignore react-native-pager-view and native-only errors on web if needed
if (Platform.OS === 'web') {
  const origError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Unable to resolve')) return;
    origError(...args);
  };
}

import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
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
import { DEFAULT_SETTINGS, setDbStorage, getDb, upsertDocument, getAllDocuments } from '@paperflip/core';
import { segmentText } from '@paperflip/core';
import { CHARS_PER_SECOND } from '@paperflip/core';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { PdfUploader } from '../src/components/PdfUploader';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  const loadRecentDocuments = async () => {
    try {
      await getDb();
      const docs = await getAllDocuments();
      setRecentDocs(docs.slice(0, 3)); // Only show top 3 recent
    } catch (e) {
      console.error('Failed to load recent documents', e);
    }
  };

  useEffect(() => {
    getDb()
      .then(() => {
        loadRecentDocuments();
      })
      .catch((err) => {
        console.error('getDb error', err);
      });
  }, []);

  const handlePdfParsed = async ({ text, filename, thumbnailUri }: { text: string; filename: string; thumbnailUri?: string }) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      console.log('Segmenting text...');
      const currentVideoLength = DEFAULT_SETTINGS.videoLength; // Should get from settings store
      const maxChars = Math.round(currentVideoLength * CHARS_PER_SECOND);
      console.log(`Using max segment length: ${maxChars} chars based on ${currentVideoLength}s video length`);

      const newSegmentedData = segmentText(text, maxChars);
      console.log(`Text segmented into ${newSegmentedData.length} segments`);

      if (newSegmentedData.length === 0) {
        console.warn('No text segments found in PDF');
      }

      console.log('Upserting document...');
      await upsertDocument(
        filename,
        newSegmentedData,
        text,
        currentVideoLength,
        0,
        thumbnailUri
      );
      console.log('Document stored in RxDB:', filename);

      router.push(`/feed?id=${encodeURIComponent(filename)}`);
    } catch (error) {
      console.error('Error processing PDF:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to process PDF: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfError = ({ error }: { error: string }) => {
    console.error('PDF Upload Error:', error);
    setErrorMessage(`Error: ${error}`);
  };

  return (
    <View className="flex-1 bg-brand-bg">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <View className="pt-8 pb-6 px-6 items-center">
            <Text className="text-4xl font-extrabold tracking-tight text-white">
              Paper<Text className="text-[#00FF88]">Flip</Text>
            </Text>
            <Text className="mt-2 text-brand-text-muted font-medium text-sm">
              Transform PDFs into immersive stories
            </Text>
          </View>

          {/* Privacy Badge */}
          <View className="px-6 mb-4">
            <View className="bg-brand-surface/40 border border-white/5 rounded-xl p-4 flex-row items-center space-x-4">
              <View className="bg-brand-primary/10 p-2 rounded-lg mr-3">
                <MaterialIcons name="security" size={20} color="#00FF88" />
              </View>
              <View>
                <Text className="font-bold text-sm leading-tight text-white">
                  100% On-Device
                </Text>
                <Text className="text-xs text-brand-text-muted mt-0.5">
                  No Cloud Uploads • Zero Tracking
                </Text>
              </View>
            </View>
          </View>

          {errorMessage && (
            <View className="px-6 mb-4">
              <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex-row items-center justify-between">
                <Text className="text-red-400 text-sm flex-1 mr-2">{errorMessage}</Text>
                <Pressable onPress={() => setErrorMessage(null)}>
                  <MaterialIcons name="close" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          )}

          {isProcessing ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#00FF88" />
              <Text className="text-white text-xl animate-pulse mt-4">Processing PDF...</Text>
            </View>
          ) : (
            <PdfUploader
              onPdfParsed={handlePdfParsed}
              onPdfError={handlePdfError}
            />
          )}

          {/* Recent Stories */}
          {!isProcessing && (
            <View className="px-6 mt-10">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-white">Recent Stories</Text>
              </View>

              <View className="space-y-3">
                {recentDocs.length > 0 ? (
                  recentDocs.map((doc) => {
                    const segments = doc.segments || [];
                    const currentIndex = doc.currentSegmentIndex || 0;
                    const currentProgress = doc.currentSegmentProgress || 0;

                    let progress = 0;
                    if (segments.length > 0) {
                      const segmentLength = segments[currentIndex]?.length || 1;
                      const granularProgress = currentIndex + currentProgress / segmentLength;
                      progress = Math.round((granularProgress / segments.length) * 100);
                    }
                    progress = Math.min(progress, 100);
                    const totalPages = doc.totalSegments || segments.length || 0;
                    const currentPage = currentIndex + 1;

                    return (
                      <Pressable
                        key={doc.documentId}
                        className="bg-brand-surface/50 border border-white/5 rounded-xl p-4 flex-row items-center space-x-4 active:bg-brand-surface/70 mb-3"
                        onPress={() => router.push(`/feed?id=${encodeURIComponent(doc.documentId)}`)}
                      >
                        <View className="w-12 h-14 bg-brand-surface-dark rounded items-center justify-center overflow-hidden relative shrink-0 mr-3">
                          <View className="w-full h-full bg-brand-surface opacity-50 absolute" />
                          {doc.thumbnailUri ? (
                            <Image source={{ uri: doc.thumbnailUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                            <MaterialIcons name="menu-book" size={20} color="#00FF88" />
                          )}
                        </View>

                        <View className="flex-1 min-w-0">
                          <View className="flex-row justify-between items-start mb-1">
                            <Text className="font-bold text-sm text-white flex-1" numberOfLines={1}>
                              {doc.documentId}
                            </Text>
                            <Text className="text-[10px] text-brand-text-muted font-medium ml-2">
                              Recent
                            </Text>
                          </View>
                          <Text className="text-[11px] text-brand-text-muted">
                            Part {currentPage} of {totalPages} • {progress}% watched
                          </Text>

                          <View className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <View
                              className="bg-[#00FF88] h-full rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-brand-text-muted text-sm">
                      No recent stories yet. Upload a PDF to get started!
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
      <StatusBar style="light" />
    </View>
  );
}
