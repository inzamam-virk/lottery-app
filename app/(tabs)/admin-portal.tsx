import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdminDashboard from '../../components/AdminDashboard';
import { UI } from '../../constants';

export default function AdminPortalScreen() {
  const handleNavigateToManageDraws = () => {
    // This will be handled by navigation in the future
    console.log('Navigate to manage draws');
  };

  const handleNavigateToManageStreams = () => {
    // This will be handled by navigation in the future
    console.log('Navigate to manage streams');
  };

  const handleNavigateToManageUsers = () => {
    // This will be handled by navigation in the future
    console.log('Navigate to manage users');
  };

  return (
    <View style={styles.container}>
      <AdminDashboard
        onNavigateToManageDraws={handleNavigateToManageDraws}
        onNavigateToManageStreams={handleNavigateToManageStreams}
        onNavigateToManageUsers={handleNavigateToManageUsers}
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
