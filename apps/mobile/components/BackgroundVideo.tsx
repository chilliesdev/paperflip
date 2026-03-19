import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface BackgroundVideoProps {
  sourceUri: string;
  isMuted?: boolean;
}

export function BackgroundVideo({ sourceUri, isMuted = true }: BackgroundVideoProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  }, [sourceUri]);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{
          uri: sourceUri,
        }}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted={isMuted}
        onPlaybackStatusUpdate={(status) => setStatus(status)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
