import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { FeedSlide } from './FeedSlide';
import { useTTS } from '../hooks/useTTS';

const { height } = Dimensions.get('window');

interface FeedProps {
  documentId: string;
  segments: string[];
  initialIndex?: number;
  karaokeMode?: boolean;
}

export function Feed({ documentId, segments, initialIndex = 0, karaokeMode = true }: FeedProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const pagerRef = useRef<PagerView>(null);

  const { speak, stop, activeWordIndex, isPlaying } = useTTS();

  useEffect(() => {
    // Stop any ongoing speech when the component mounts or unmounts
    stop();
    return () => stop();
  }, [stop]);

  useEffect(() => {
    // When the active slide changes, speak the current segment
    if (segments[activeIndex]) {
      speak(segments[activeIndex]);
    }
  }, [activeIndex, segments, speak]);

  const onPageSelected = (e: { nativeEvent: { position: number } }) => {
    setActiveIndex(e.nativeEvent.position);
  };

  if (!segments || segments.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No segments available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PagerView
        style={styles.pagerView}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}
        orientation="vertical"
      >
        {segments.map((segment, index) => (
          <View key={`${documentId}-${index}`} style={styles.page}>
            <FeedSlide
              segment={segment}
              isActive={index === activeIndex}
              activeWordIndex={activeWordIndex}
              karaokeMode={karaokeMode}
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  }
});
