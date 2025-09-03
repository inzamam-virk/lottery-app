import React from 'react';
import { View, StyleSheet } from 'react-native';

import { UI } from '../../constants';
import LandingPage from '@/components/LandingPage';

export default function LiveStreamingScreen() {
  return (
    <View style={styles.container}>
      <LandingPage />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.BACKGROUND,
  },
});
