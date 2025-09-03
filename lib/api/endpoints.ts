// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGN_UP: '/auth/v1/signup',
    SIGN_IN: '/auth/v1/token?grant_type=password',
    SIGN_OUT: '/auth/v1/logout',
    REFRESH_TOKEN: '/auth/v1/token?grant_type=refresh_token',
    RESET_PASSWORD: '/auth/v1/recover',
    UPDATE_PASSWORD: '/auth/v1/user',
    GET_USER: '/auth/v1/user',
  },

  // Users
  USERS: {
    BASE: '/rest/v1/users',
    PROFILE: (id: string) => `/rest/v1/users?id=eq.${id}`,
    UPDATE_PROFILE: (id: string) => `/rest/v1/users?id=eq.${id}`,
    DELETE_USER: (id: string) => `/rest/v1/users?id=eq.${id}`,
  },

  // Draws
  DRAWS: {
    BASE: '/rest/v1/draws',
    CURRENT: '/rest/v1/draws?status=eq.scheduled&scheduled_at=gte.now()&order=scheduled_at.asc&limit=1',
    UPCOMING: '/rest/v1/draws?status=eq.scheduled&scheduled_at=gte.now()&order=scheduled_at.asc',
    COMPLETED: '/rest/v1/draws?status=eq.completed&order=scheduled_at.desc',
    BY_ID: (id: string) => `/rest/v1/draws?id=eq.${id}`,
    CREATE: '/rest/v1/draws',
    UPDATE: (id: string) => `/rest/v1/draws?id=eq.${id}`,
    DELETE: (id: string) => `/rest/v1/draws?id=eq.${id}`,
    RUN_DRAW: (id: string) => `/rest/v1/draws?id=eq.${id}`,
    SETTLE_DRAW: (id: string) => `/rest/v1/draws?id=eq.${id}`,
  },

  // Bets
  BETS: {
    BASE: '/rest/v1/bets',
    BY_DEALER: (dealerId: string) => `/rest/v1/bets?dealer_id=eq.${dealerId}&order=created_at.desc`,
    BY_DRAW: (drawId: string) => `/rest/v1/bets?draw_id=eq.${drawId}&order=created_at.desc`,
    BY_DEALER_AND_DRAW: (dealerId: string, drawId: string) => 
      `/rest/v1/bets?dealer_id=eq.${dealerId}&draw_id=eq.${drawId}&order=created_at.desc`,
    PENDING: (dealerId: string) => `/rest/v1/bets?dealer_id=eq.${dealerId}&status=eq.pending&order=created_at.desc`,
    CREATE: '/rest/v1/bets',
    UPDATE: (id: string) => `/rest/v1/bets?id=eq.${id}`,
    DELETE: (id: string) => `/rest/v1/bets?id=eq.${id}`,
  },

  // Refunds
  REFUNDS: {
    BASE: '/rest/v1/refunds',
    BY_BET: (betId: string) => `/rest/v1/refunds?bet_id=eq.${betId}`,
    BY_DEALER: (dealerId: string) => `/rest/v1/refunds?dealer_id=eq.${dealerId}&order=created_at.desc`,
    CREATE: '/rest/v1/refunds',
    PROCESS: (id: string) => `/rest/v1/refunds?id=eq.${id}`,
  },

  // Streams
  STREAMS: {
    BASE: '/rest/v1/streams',
    ACTIVE: '/rest/v1/streams?active=eq.true&order=order.asc',
    BY_ID: (id: string) => `/rest/v1/streams?id=eq.${id}`,
    CREATE: '/rest/v1/streams',
    UPDATE: (id: string) => `/rest/v1/streams?id=eq.${id}`,
    DELETE: (id: string) => `/rest/v1/streams?id=eq.${id}`,
    TOGGLE_ACTIVE: (id: string) => `/rest/v1/streams?id=eq.${id}`,
  },

  // Statistics
  STATS: {
    DEALER_STATS: (dealerId: string) => `/rest/v1/bets?dealer_id=eq.${dealerId}&select=stake,status,created_at`,
    DRAW_STATS: (drawId: string) => `/rest/v1/bets?draw_id=eq.${drawId}&select=stake,status,created_at`,
    TOTAL_BETS: (drawId: string) => `/rest/v1/bets?draw_id=eq.${drawId}&select=count`,
    TOTAL_STAKE: (drawId: string) => `/rest/v1/bets?draw_id=eq.${drawId}&select=stake`,
  },

  // Realtime Channels
  REALTIME: {
    DRAWS: 'draws',
    BETS: 'bets',
    REFUNDS: 'refunds',
    STREAMS: 'streams',
    RESULTS: 'results',
  },
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// API Response Status Codes
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
