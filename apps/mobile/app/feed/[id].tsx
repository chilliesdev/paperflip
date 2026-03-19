import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function FeedScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text className="text-2xl font-bold text-blue-500 mb-4">Feed for {id}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
