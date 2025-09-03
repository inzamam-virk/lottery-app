-- Initial LotteryApp Database Schema
-- Migration: 001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'dealer', 'public');
CREATE TYPE draw_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'refunded');
CREATE TYPE stream_type AS ENUM ('hls', 'mp4', 'youtube', 'archive');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'public',
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draws table
CREATE TABLE IF NOT EXISTS draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  winning_number INTEGER CHECK (winning_number >= 0 AND winning_number <= 999),
  status draw_status DEFAULT 'scheduled',
  total_bets INTEGER DEFAULT 0,
  total_stake DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dealer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  number INTEGER CHECK (number >= 0 AND number <= 999) NOT NULL,
  stake DECIMAL(10,2) NOT NULL CHECK (stake > 0),
  status bet_status DEFAULT 'pending',
  potential_win DECIMAL(10,2),
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  processed_by UUID REFERENCES users(id) ON DELETE CASCADE,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type stream_type NOT NULL,
  duration_seconds INTEGER,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (for audit trail)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_draws_scheduled_at ON draws(scheduled_at);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_bets_dealer_id ON bets(dealer_id);
CREATE INDEX idx_bets_draw_id ON bets(draw_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_number ON bets(number);
CREATE INDEX idx_streams_active ON streams(is_active);
CREATE INDEX idx_streams_priority ON streams(priority);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Draws policies
CREATE POLICY "Public can view draws" ON draws
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage draws" ON draws
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bets policies
CREATE POLICY "Dealers can view their own bets" ON bets
  FOR SELECT USING (
    dealer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Dealers can create bets" ON bets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'dealer'
    )
  );

CREATE POLICY "Admins can manage all bets" ON bets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Refunds policies
CREATE POLICY "Dealers can view refunds for their bets" ON refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bets WHERE id = bet_id AND dealer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage refunds" ON refunds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Streams policies
CREATE POLICY "Public can view active streams" ON streams
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage streams" ON streams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION get_current_draw()
RETURNS TABLE (
  id UUID,
  scheduled_at TIMESTAMPTZ,
  status draw_status,
  time_until_draw BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.scheduled_at,
    d.status,
    EXTRACT(EPOCH FROM (d.scheduled_at - NOW()))::BIGINT as time_until_draw
  FROM draws d
  WHERE d.status = 'scheduled' 
    AND d.scheduled_at > NOW()
  ORDER BY d.scheduled_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_betting_open(draw_time TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN draw_time > NOW() + INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data
INSERT INTO streams (title, description, url, type, duration_seconds, priority) VALUES
('Classic Cartoons', 'Vintage animated content', 'https://archive.org/download/classic_cartoons_001/classic_cartoons_001.mp4', 'archive', 1800, 1),
('Documentary Collection', 'Educational content', 'https://archive.org/download/doc_collection_001/doc_collection_001.mp4', 'archive', 3600, 2),
('Public Domain Movies', 'Classic films', 'https://archive.org/download/public_domain_001/public_domain_001.mp4', 'archive', 5400, 3)
ON CONFLICT DO NOTHING;

-- Create the first draw (next hour)
INSERT INTO draws (scheduled_at, status) VALUES
(NOW() + INTERVAL '1 hour', 'scheduled')
ON CONFLICT DO NOTHING;
