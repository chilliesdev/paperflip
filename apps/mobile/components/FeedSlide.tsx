import { View, Text, StyleSheet } from 'react-native';

interface FeedSlideProps {
  segment: string;
  isActive: boolean;
  activeWordIndex: number;
  karaokeMode: boolean;
}

export function FeedSlide({ segment, isActive, activeWordIndex, karaokeMode }: FeedSlideProps) {
  // Simple word splitting for basic implementation
  const words = segment.split(' ');

  return (
    <View style={styles.container}>
      <Text style={styles.textContainer}>
        {words.map((word, index) => {
          const isHighlighted = isActive && karaokeMode && index === activeWordIndex;
          return (
            <Text
              key={index}
              style={[
                styles.word,
                isHighlighted && styles.highlightedWord
              ]}
            >
              {word}{' '}
            </Text>
          );
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 16,
    margin: 10,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    textAlign: 'center',
  },
  word: {
    fontSize: 24,
    color: '#e2e8f0', // slate-200
    lineHeight: 36,
    fontWeight: '500',
  },
  highlightedWord: {
    color: '#38bdf8', // sky-400
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.2)', // subtle sky background
  }
});