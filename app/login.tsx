import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import LoginScreen from '../components/LoginScreen';
import { useAuthStore } from '../stores/authStore';
import { UI } from '../constants';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    router.replace('/(tabs)');
  };

  const handleNavigateToSignUp = () => {
    // For now, we'll just show the signup form in the same screen
    // In the future, this could navigate to a separate signup screen
    console.log('Show signup form');
  };

  return (
    <View style={styles.container}>
      <LoginScreen
        onNavigateToSignUp={handleNavigateToSignUp}
        onLoginSuccess={handleLoginSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.BACKGROUND,
  },
});
