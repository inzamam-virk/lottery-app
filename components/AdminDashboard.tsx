import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useLotteryStore } from '../stores/lotteryStore';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/api/client';
import { Draw, Bet, Stream } from '../types';
import { UI, LOTTERY_CONFIG } from '../constants';
import { formatPKT } from '../lib/utils/time';

interface AdminDashboardProps {
  onNavigateToManageDraws?: () => void;
  onNavigateToManageStreams?: () => void;
  onNavigateToManageUsers?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToManageDraws,
  onNavigateToManageStreams,
  onNavigateToManageUsers,
}) => {
  const { user } = useAuthStore();
  const { currentDraw, upcomingDraws, completedDraws, activeStreams, fetchCurrentDraw, fetchUpcomingDraws, fetchCompletedDraws, fetchActiveStreams, isLoading, error } = useLotteryStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBets: 0,
    totalStake: 0,
    totalWins: 0,
    totalRefunds: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchCurrentDraw(),
      fetchUpcomingDraws(),
      fetchCompletedDraws(),
      fetchActiveStreams(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleScheduleDraws = async () => {
    try {
      const response = await apiClient.scheduleDraws();
      if (response.success) {
        Alert.alert('Success', 'Draws scheduled successfully');
        fetchUpcomingDraws();
      } else {
        Alert.alert('Error', response.error || 'Failed to schedule draws');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule draws');
    }
  };

  const handleRunDraws = async () => {
    try {
      const response = await apiClient.runDraws();
      if (response.success) {
        Alert.alert('Success', `Processed ${response.results?.length || 0} draws`);
        fetchData();
      } else {
        Alert.alert('Error', response.error || 'Failed to run draws');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to run draws');
    }
  };

  const renderDrawItem = ({ item }: { item: Draw }) => (
    <View style={styles.drawItem}>
      <Text style={styles.drawTime}>{formatPKT(item.scheduled_at)}</Text>
      <Text style={styles.drawStatus}>{item.status}</Text>
      {item.winning_number !== undefined && (
        <Text style={styles.winningNumber}>Winning: {item.winning_number}</Text>
      )}
      {item.total_bets > 0 && (
        <Text style={styles.drawStats}>
          Bets: {item.total_bets} | Stake: ${item.total_stake}
        </Text>
      )}
    </View>
  );

  const renderStreamItem = ({ item }: { item: Stream }) => (
    <View style={styles.streamItem}>
      <Text style={styles.streamTitle}>{item.title}</Text>
      <Text style={styles.streamDescription}>{item.description}</Text>
      <Text style={styles.streamType}>{item.type}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.email}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleScheduleDraws}>
            <Text style={styles.actionButtonText}>Schedule Draws</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleRunDraws}>
            <Text style={styles.actionButtonText}>Run Draws</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Draw Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Draw</Text>
        {currentDraw ? (
          <View style={styles.currentDrawCard}>
            <Text style={styles.drawTime}>{formatPKT(currentDraw.scheduled_at)}</Text>
            <Text style={styles.drawStatus}>{currentDraw.status}</Text>
            {currentDraw.status === 'completed' && currentDraw.winning_number !== undefined && (
              <Text style={styles.winningNumber}>Winning Number: {currentDraw.winning_number}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No current draw</Text>
        )}
      </View>

      {/* Upcoming Draws */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Draws</Text>
        {upcomingDraws.length > 0 ? (
          <FlatList
            data={upcomingDraws}
            renderItem={renderDrawItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalList}
          />
        ) : (
          <Text style={styles.noData}>No upcoming draws</Text>
        )}
      </View>

      {/* Recent Completed Draws */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Results</Text>
        {completedDraws.length > 0 ? (
          <FlatList
            data={completedDraws.slice(0, 5)}
            renderItem={renderDrawItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalList}
          />
        ) : (
          <Text style={styles.noData}>No completed draws</Text>
        )}
      </View>

      {/* Active Streams */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Streams</Text>
        {activeStreams.length > 0 ? (
          <FlatList
            data={activeStreams}
            renderItem={renderStreamItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalList}
          />
        ) : (
          <Text style={styles.noData}>No active streams</Text>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.navButton} onPress={onNavigateToManageDraws}>
            <Text style={styles.navButtonText}>Manage Draws</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={onNavigateToManageStreams}>
            <Text style={styles.navButtonText}>Manage Streams</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={onNavigateToManageUsers}>
            <Text style={styles.navButtonText}>Manage Users</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={UI.COLORS.PRIMARY} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.BACKGROUND,
  },
  header: {
    padding: UI.SPACING.LARGE,
    backgroundColor: UI.COLORS.PRIMARY,
  },
  title: {
    fontSize: UI.FONT_SIZES.XLARGE,
    fontWeight: 'bold',
    color: UI.COLORS.WHITE,
    marginBottom: UI.SPACING.SMALL,
  },
  subtitle: {
    fontSize: UI.FONT_SIZES.MEDIUM,
    color: UI.COLORS.WHITE,
    opacity: 0.8,
  },
  section: {
    padding: UI.SPACING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: UI.FONT_SIZES.LARGE,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.MEDIUM,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: UI.SPACING.MEDIUM,
  },
  actionButton: {
    flex: 1,
    backgroundColor: UI.COLORS.SECONDARY,
    padding: UI.SPACING.MEDIUM,
    borderRadius: UI.BORDER_RADIUS.MEDIUM,
    alignItems: 'center',
  },
  actionButtonText: {
    color: UI.COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: UI.FONT_SIZES.MEDIUM,
  },
  currentDrawCard: {
    backgroundColor: UI.COLORS.CARD,
    padding: UI.SPACING.MEDIUM,
    borderRadius: UI.BORDER_RADIUS.MEDIUM,
    borderLeftWidth: 4,
    borderLeftColor: UI.COLORS.PRIMARY,
  },
  drawItem: {
    backgroundColor: UI.COLORS.CARD,
    padding: UI.SPACING.MEDIUM,
    borderRadius: UI.BORDER_RADIUS.MEDIUM,
    marginRight: UI.SPACING.MEDIUM,
    minWidth: 200,
  },
  streamItem: {
    backgroundColor: UI.COLORS.CARD,
    padding: UI.SPACING.MEDIUM,
    borderRadius: UI.BORDER_RADIUS.MEDIUM,
    marginRight: UI.SPACING.MEDIUM,
    minWidth: 200,
  },
  drawTime: {
    fontSize: UI.FONT_SIZES.MEDIUM,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.SMALL,
  },
  drawStatus: {
    fontSize: UI.FONT_SIZES.SMALL,
    color: UI.COLORS.SECONDARY,
    marginBottom: UI.SPACING.SMALL,
  },
  winningNumber: {
    fontSize: UI.FONT_SIZES.LARGE,
    fontWeight: 'bold',
    color: UI.COLORS.SUCCESS,
    marginBottom: UI.SPACING.SMALL,
  },
  drawStats: {
    fontSize: UI.FONT_SIZES.SMALL,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  streamTitle: {
    fontSize: UI.FONT_SIZES.MEDIUM,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.SMALL,
  },
  streamDescription: {
    fontSize: UI.FONT_SIZES.SMALL,
    color: UI.COLORS.TEXT_SECONDARY,
    marginBottom: UI.SPACING.SMALL,
  },
  streamType: {
    fontSize: UI.FONT_SIZES.SMALL,
    color: UI.COLORS.SECONDARY,
  },
  noData: {
    textAlign: 'center',
    color: UI.COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  horizontalList: {
    marginHorizontal: -UI.SPACING.LARGE,
  },
  navigationButtons: {
    gap: UI.SPACING.MEDIUM,
  },
  navButton: {
    backgroundColor: UI.COLORS.CARD,
    padding: UI.SPACING.MEDIUM,
    borderRadius: UI.BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: UI.COLORS.BORDER,
  },
  navButtonText: {
    color: UI.COLORS.TEXT,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: UI.FONT_SIZES.MEDIUM,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminDashboard;
