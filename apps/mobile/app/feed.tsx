import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDb, getDocument, resegmentDocument, getSettings } from '@paperflip/core';
import { Feed } from '../src/components/feed/Feed';

export default function FeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResegmenting, setIsResegmenting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No document ID provided');
      setIsLoading(false);
      return;
    }

    const loadDocAndSettings = async () => {
      try {
        await getDb(); // Ensure DB is initialized

        const [loadedDoc, loadedSettings] = await Promise.all([
          getDocument(id),
          getSettings()
        ]);

        if (loadedDoc) {
          setDoc(loadedDoc);
        } else {
          setError('Document not found');
        }
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Error loading document/settings:', err);
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocAndSettings();
  }, [id]);

  useEffect(() => {
    if (doc && doc.fullText && settings && !isResegmenting) {
      const currentVideoLength = settings.videoLength;
      if (doc.videoLengthAtSegmentation !== currentVideoLength) {
        console.log(`Re-segmenting document from ${doc.videoLengthAtSegmentation}s to ${currentVideoLength}s`);
        setIsResegmenting(true);
        resegmentDocument(id!, currentVideoLength)
          .then((newDoc) => {
            if (newDoc) {
              setDoc(newDoc);
            }
            setIsResegmenting(false);
          })
          .catch((e) => {
            console.error('Resegmentation failed:', e);
            setIsResegmenting(false);
          });
      }
    }
  }, [doc, id, isResegmenting, settings]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#00FF88" />
        <Text className="text-white mt-4 animate-pulse">Loading feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Text className="text-red-500 text-xl text-center mb-4">{error}</Text>
        <Text className="text-[#00FF88] underline" onPress={() => router.back()}>
          Go back
        </Text>
      </View>
    );
  }

  if (doc?.segments && doc.segments.length > 0 && settings) {
    return (
      <View className="flex-1 bg-black">
        <Feed
          key={doc.videoLengthAtSegmentation} // Force remount on resegmentation
          segments={doc.segments}
          initialIndex={settings.autoResume ? (doc.currentSegmentIndex || 0) : 0}
          initialProgress={settings.autoResume ? (doc.currentSegmentProgress || 0) : 0}
          documentId={id!}
        />

        {isResegmenting && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
            <ActivityIndicator size="large" color="#00FF88" />
            <Text className="text-white font-bold text-lg uppercase tracking-wide mt-4">
              Resegmenting...
            </Text>
            <Text className="text-white/60 text-sm mt-2">
              Adjusting for {settings.videoLength}s video length
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black items-center justify-center p-6">
      <Text className="text-white text-xl text-center mb-4">No content found for this document.</Text>
      <Text className="text-[#00FF88] underline" onPress={() => router.back()}>
        Go back
      </Text>
    </View>
  );
}
