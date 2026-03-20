import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDb, getDocument, resegmentDocument } from '@paperflip/core';
import { Feed } from '../src/components/feed/Feed';
import { DEFAULT_SETTINGS } from '@paperflip/core';

export default function FeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doc, setDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResegmenting, setIsResegmenting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No document ID provided');
      setIsLoading(false);
      return;
    }

    const loadDoc = async () => {
      try {
        await getDb(); // Ensure DB is initialized

        const loadedDoc = await getDocument(id);
        if (loadedDoc) {
          setDoc(loadedDoc);
        } else {
          setError('Document not found');
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    loadDoc();
  }, [id]);

  useEffect(() => {
    if (doc && doc.fullText && !isResegmenting) {
      const currentVideoLength = DEFAULT_SETTINGS.videoLength; // Should get from settings store in reality
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
  }, [doc, id, isResegmenting]);

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

  if (doc?.segments && doc.segments.length > 0) {
    return (
      <View className="flex-1 bg-black">
        <Feed
          key={doc.videoLengthAtSegmentation} // Force remount on resegmentation
          segments={doc.segments}
          initialIndex={DEFAULT_SETTINGS.autoResume ? (doc.currentSegmentIndex || 0) : 0}
          initialProgress={DEFAULT_SETTINGS.autoResume ? (doc.currentSegmentProgress || 0) : 0}
          documentId={id!}
        />

        {isResegmenting && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
            <ActivityIndicator size="large" color="#00FF88" />
            <Text className="text-white font-bold text-lg uppercase tracking-wide mt-4">
              Resegmenting...
            </Text>
            <Text className="text-white/60 text-sm mt-2">
              Adjusting for {DEFAULT_SETTINGS.videoLength}s video length
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
