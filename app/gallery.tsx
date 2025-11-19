import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GalleryScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Gallery Not Available</Text>
        <Text style={styles.message}>
          Media library access has been disabled to simplify permissions.
        </Text>
        <Text style={styles.message}>
          Photos are saved to your device gallery when taken.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
});