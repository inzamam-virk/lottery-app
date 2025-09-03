import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});
