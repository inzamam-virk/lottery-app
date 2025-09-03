import React from 'react';
import { View, StyleSheet } from 'react-native';
import DealerDashboard from '../../components/DealerDashboard';
import { UI } from '../../constants';

export default function DealerPortalScreen() {
  const handleNavigateToNewBet = () => {
    // This will be handled by navigation in the future
    console.log('Navigate to new bet');
  };

  const handleNavigateToBetHistory = () => {
    // This will be handled by navigation in the future
    console.log('Navigate to bet history');
  };

  return (
    <View style={styles.container}>
      <DealerDashboard
        onNavigateToNewBet={handleNavigateToNewBet}
        onNavigateToBetHistory={handleNavigateToBetHistory}
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
