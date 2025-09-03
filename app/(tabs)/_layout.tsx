import { Tabs } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  console.log('🔍 TabLayout: Starting render');
  const { isAuthenticated, user } = useAuthStore();

  console.log('🔍 TabLayout: isAuthenticated =', isAuthenticated, 'user =', user);

  console.log('🔍 TabLayout: Rendering tabs for all users');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dealer-portal"
        options={{
          title: 'Dealer Portal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'business' : 'business-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {user?.role === 'admin' && (
        <Tabs.Screen
          name="admin-portal"
          options={{
            title: 'Admin Portal',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
