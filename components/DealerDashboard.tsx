import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLotteryStore } from '../stores/lotteryStore';
import { useAuthStore } from '../stores/authStore';
import { Bet, Draw } from '../types';
import { UI, LOTTERY_CONFIG } from '../constants';
import { formatPKT, isBettingOpen } from '../lib/utils/time';

interface DealerDashboardProps {
  onNavigateToNewBet: () => void;
  onNavigateToBetHistory: () => void;
}

const DealerDashboard: React.FC<DealerDashboardProps> = ({
  onNavigateToNewBet,
  onNavigateToBetHistory,
}) => {
  const { user } = useAuthStore();
  const {
    currentDraw,
    bets,
    fetchCurrentDraw,
    fetchBets,
    isLoading,
    error,
  } = useLotteryStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCurrentDraw();
      fetchBets(user.id, currentDraw?.id);
    }
  }, [user?.id, currentDraw?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCurrentDraw(),
      fetchBets(user?.id, currentDraw?.id),
    ]);
    setRefreshing(false);
  };

  const getBettingStatus = () => {
    if (!currentDraw) return { text: 'No upcoming draws', color: UI.COLORS.TEXT_SECONDARY };
    
    if (isBettingOpen(currentDraw.scheduled_at)) {
      return { text: 'Betting Open', color: UI.COLORS.SUCCESS };
    } else {
      return { text: 'Betting Closed', color: UI.COLORS.ERROR };
    }
  };

  const getTotalStake = () => {
    return bets.reduce((total, bet) => total + bet.stake, 0);
  };

  const getBetCount = () => bets.length;

  const renderBetItem = ({ item }: { item: Bet }) => (
    <View style={styles.betItem}>
      <View style={styles.betHeader}>
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.betNumber}>#{item.number.toString().padStart(3, '0')}</Text>
      </View>
      
      <View style={styles.betDetails}>
        <Text style={styles.betStake}>Stake: Rs. {item.stake.toLocaleString()}</Text>
        <Text style={styles.betTime}>
          {formatPKT(item.created_at, 'HH:mm')}
        </Text>
      </View>
      
      <View style={styles.betStatus}>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return UI.COLORS.WARNING;
      case 'won':
        return UI.COLORS.SUCCESS;
      case 'lost':
        return UI.COLORS.ERROR;
      case 'refunded':
        return UI.COLORS.TEXT_SECONDARY;
      default:
        return UI.COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Unknown';
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI.COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dealer Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.email}</Text>
      </View>

      {/* Current Draw Status */}
      {currentDraw && (
        <View style={styles.drawStatusCard}>
          <Text style={styles.drawStatusTitle}>Next Draw</Text>
          <Text style={styles.drawTime}>
            {formatPKT(currentDraw.scheduled_at, 'PPpp')}
          </Text>
          
          <View style={styles.bettingStatus}>
            <Text style={styles.bettingStatusLabel}>Status:</Text>
            <Text style={[styles.bettingStatusText, { color: getBettingStatus().color }]}>
              {getBettingStatus().text}
            </Text>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getBetCount()}</Text>
          <Text style={styles.statLabel}>Total Bets</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Rs. {getTotalStake().toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Stake</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            Rs. {(getTotalStake() * (LOTTERY_CONFIG.REFUND_PERCENTAGE / 100)).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Potential Refund</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.primaryButton,
            !getBettingStatus().text.includes('Open') && styles.disabledButton,
          ]}
          onPress={onNavigateToNewBet}
          disabled={!getBettingStatus().text.includes('Open')}
        >
          <Text style={styles.primaryButtonText}>Place New Bet</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onNavigateToBetHistory}
        >
          <Text style={styles.secondaryButtonText}>View All Bets</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Bets */}
      <View style={styles.recentBetsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bets</Text>
          <TouchableOpacity onPress={onNavigateToBetHistory}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {bets.length > 0 ? (
          <FlatList
            data={bets.slice(0, 5)} // Show only last 5 bets
            renderItem={renderBetItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No bets placed yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start placing bets for your clients
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.BACKGROUND,
    padding: UI.SPACING.MD,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI.COLORS.BACKGROUND,
  },
  
  loadingText: {
    marginTop: UI.SPACING.MD,
    fontSize: 16,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: UI.SPACING.LG,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.XS,
  },
  
  subtitle: {
    fontSize: 16,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  drawStatusCard: {
    backgroundColor: UI.COLORS.CARD,
    borderRadius: UI.BORDER_RADIUS.LG,
    padding: UI.SPACING.LG,
    marginBottom: UI.SPACING.LG,
    borderLeftWidth: 4,
    borderLeftColor: UI.COLORS.PRIMARY,
  },
  
  drawStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.SM,
  },
  
  drawTime: {
    fontSize: 16,
    color: UI.COLORS.TEXT_SECONDARY,
    marginBottom: UI.SPACING.MD,
  },
  
  bettingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  bettingStatusLabel: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
    marginRight: UI.SPACING.SM,
  },
  
  bettingStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI.SPACING.LG,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: UI.COLORS.CARD,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    alignItems: 'center',
    marginHorizontal: UI.SPACING.XS,
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI.COLORS.PRIMARY,
    marginBottom: UI.SPACING.XS,
  },
  
  statLabel: {
    fontSize: 12,
    color: UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: UI.SPACING.MD,
    marginBottom: UI.SPACING.LG,
  },
  
  actionButton: {
    flex: 1,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    alignItems: 'center',
  },
  
  primaryButton: {
    backgroundColor: UI.COLORS.PRIMARY,
  },
  
  secondaryButton: {
    backgroundColor: UI.COLORS.CARD,
    borderWidth: 1,
    borderColor: UI.COLORS.PRIMARY,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  primaryButtonText: {
    color: UI.COLORS.CARD,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  secondaryButtonText: {
    color: UI.COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  recentBetsSection: {
    flex: 1,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI.SPACING.MD,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
  },
  
  viewAllText: {
    color: UI.COLORS.PRIMARY,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  
  betItem: {
    backgroundColor: UI.COLORS.CARD,
    borderRadius: UI.BORDER_RADIUS.MD,
    padding: UI.SPACING.MD,
    marginBottom: UI.SPACING.SM,
  },
  
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI.SPACING.SM,
  },
  
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: UI.COLORS.TEXT,
  },
  
  betNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI.COLORS.PRIMARY,
  },
  
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI.SPACING.SM,
  },
  
  betStake: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  betTime: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  betStatus: {
    alignItems: 'flex-end',
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI.SPACING.XL,
  },
  
  emptyStateText: {
    fontSize: 18,
    color: UI.COLORS.TEXT_SECONDARY,
    marginBottom: UI.SPACING.SM,
  },
  
  emptyStateSubtext: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default DealerDashboard;
