// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'dealer' | 'public';

// Draw Types
export interface Draw {
  id: string;
  scheduled_at: string;
  started_at?: string;
  finished_at?: string;
  winning_number?: number;
  status: DrawStatus;
  created_at: string;
  updated_at: string;
}

export type DrawStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Bet Types
export interface Bet {
  id: string;
  dealer_id: string;
  client_name: string;
  client_phone?: string;
  draw_id: string;
  number: number;
  stake: number;
  status: BetStatus;
  created_at: string;
  updated_at: string;
}

export type BetStatus = 'pending' | 'won' | 'lost' | 'refunded';

// Refund Types
export interface Refund {
  id: string;
  bet_id: string;
  amount: number;
  processed_at?: string;
  created_at: string;
}

// Stream Types
export interface Stream {
  id: string;
  title: string;
  description: string;
  url: string;
  type: StreamType;
  active: boolean;
  order: number;
  created_at: string;
}

export type StreamType = 'hls' | 'mp4' | 'youtube';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface BetForm {
  client_name: string;
  client_phone?: string;
  number: number;
  stake: number;
}

// Time and Date Types
export interface DrawSchedule {
  next_draw: string;
  time_until_draw: number; // milliseconds
  is_betting_open: boolean;
  cut_off_time: string;
}
