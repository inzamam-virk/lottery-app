import { create } from 'zustand';
import { Draw, Bet, Stream, DrawSchedule } from '../types';
import { apiClient } from '../lib/api/client';
import { API_ENDPOINTS } from '../lib/api/endpoints';
import { LOTTERY_CONFIG } from '../constants';

interface LotteryState {
  currentDraw: Draw | null;
  upcomingDraws: Draw[];
  completedDraws: Draw[];
  activeStreams: Stream[];
  bets: Bet[];
  isLoading: boolean;
  error: string | null;
  drawSchedule: DrawSchedule | null;
}

interface LotteryActions {
  fetchCurrentDraw: () => Promise<void>;
  fetchUpcomingDraws: () => Promise<void>;
  fetchCompletedDraws: () => Promise<void>;
  fetchActiveStreams: () => Promise<void>;
  fetchBets: (dealerId?: string, drawId?: string) => Promise<void>;
  placeBet: (betData: Omit<Bet, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<boolean>;
  calculateDrawSchedule: () => void;
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
  clearError: () => void;
}

type LotteryStore = LotteryState & LotteryActions;

export const useLotteryStore = create<LotteryStore>((set, get) => ({
  // Initial state
  currentDraw: null,
  upcomingDraws: [],
  completedDraws: [],
  activeStreams: [],
  bets: [],
  isLoading: false,
  error: null,
  drawSchedule: null,

  // Actions
  fetchCurrentDraw: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<Draw[]>(API_ENDPOINTS.DRAWS.CURRENT);
      
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      if (response.data && response.data.length > 0) {
        set({ currentDraw: response.data[0], isLoading: false });
        get().calculateDrawSchedule();
      } else {
        set({ currentDraw: null, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch current draw';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchUpcomingDraws: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<Draw[]>(API_ENDPOINTS.DRAWS.UPCOMING);
      
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      set({ upcomingDraws: response.data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch upcoming draws';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchCompletedDraws: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<Draw[]>(API_ENDPOINTS.DRAWS.COMPLETED);
      
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      set({ completedDraws: response.data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch completed draws';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchActiveStreams: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.getStreams();
      
      if (response.error) {
        // If edge function not deployed, set empty streams
        if (response.error === 'Function not yet deployed') {
          set({ activeStreams: [], isLoading: false });
          return;
        }
        set({ error: response.error, isLoading: false });
        return;
      }

      set({ activeStreams: response.streams || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch active streams';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchBets: async (dealerId?: string, drawId?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      let endpoint = API_ENDPOINTS.BETS.BASE;
      if (dealerId && drawId) {
        endpoint = API_ENDPOINTS.BETS.BY_DEALER_AND_DRAW(dealerId, drawId);
      } else if (dealerId) {
        endpoint = API_ENDPOINTS.BETS.BY_DEALER(dealerId);
      } else if (drawId) {
        endpoint = API_ENDPOINTS.BETS.BY_DRAW(drawId);
      }
      
      const response = await apiClient.get<Bet[]>(endpoint);
      
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      set({ bets: response.data || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bets';
      set({ error: errorMessage, isLoading: false });
    }
  },

  placeBet: async (betData) => {
    try {
      set({ isLoading: true, error: null });
      
      const bet = {
        ...betData,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const response = await apiClient.post<Bet>(API_ENDPOINTS.BETS.CREATE, bet);
      
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return false;
      }

      // Add the new bet to the current list
      set(state => ({
        bets: [response.data!, ...state.bets],
        isLoading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to place bet';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  calculateDrawSchedule: () => {
    const { currentDraw } = get();
    if (!currentDraw) {
      set({ drawSchedule: null });
      return;
    }

    const now = new Date();
    const drawTime = new Date(currentDraw.scheduled_at);
    const timeUntilDraw = drawTime.getTime() - now.getTime();
    
    // Calculate cut-off time (15 minutes before draw)
    const cutOffTime = new Date(drawTime.getTime() - (LOTTERY_CONFIG.BET_CUTOFF_MINUTES * 60 * 1000));
    const isBettingOpen = now < cutOffTime;

    const schedule: DrawSchedule = {
      next_draw: currentDraw.scheduled_at,
      time_until_draw: Math.max(0, timeUntilDraw),
      is_betting_open: isBettingOpen,
      cut_off_time: cutOffTime.toISOString(),
    };

    set({ drawSchedule: schedule });
  },

  subscribeToUpdates: () => {
    // Subscribe to realtime updates
    const drawsChannel = apiClient.subscribeToChannel(
      API_ENDPOINTS.REALTIME.DRAWS,
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          get().fetchCurrentDraw();
          get().fetchUpcomingDraws();
        }
      }
    );

    const betsChannel = apiClient.subscribeToChannel(
      API_ENDPOINTS.REALTIME.BETS,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          // Refresh bets if we're currently viewing them
          const { bets } = get();
          if (bets.length > 0) {
            get().fetchBets();
          }
        }
      }
    );

    const streamsChannel = apiClient.subscribeToChannel(
      API_ENDPOINTS.REALTIME.STREAMS,
      (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          get().fetchActiveStreams();
        }
      }
    );
  },

  unsubscribeFromUpdates: () => {
    apiClient.unsubscribeFromChannel(API_ENDPOINTS.REALTIME.DRAWS);
    apiClient.unsubscribeFromChannel(API_ENDPOINTS.REALTIME.BETS);
    apiClient.unsubscribeFromChannel(API_ENDPOINTS.REALTIME.STREAMS);
  },

  clearError: () => {
    set({ error: null });
  },
}));
