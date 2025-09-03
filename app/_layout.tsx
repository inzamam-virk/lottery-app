import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import LoadingScreen from '../components/LoadingScreen';

export default function RootLayout() {
  console.log('🔍 RootLayout: Starting render');
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    console.log('🔍 RootLayout: useEffect triggered, checkAuth called');
    checkAuth();
  }, [checkAuth]);

  console.log('🔍 RootLayout: isLoading =', isLoading);

  if (isLoading) {
    console.log('🔍 RootLayout: Showing loading state');
    return <LoadingScreen message="Initializing..." />;
  }

  console.log('🔍 RootLayout: Rendering main layout');

  return (
    <ErrorBoundary>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Login',
            headerShown: false,
          }}
        />
      </Stack>
    </ErrorBoundary>
  );
}
