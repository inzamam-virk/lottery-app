-- LotteryApp Database Schema
-- This file contains all the necessary tables and configurations for the LotteryApp

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'dealer', 'public');
CREATE TYPE draw_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'refunded');
CREATE TYPE stream_type AS ENUM ('hls', 'mp4', 'youtube');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Draws table
CREATE TABLE IF NOT EXISTS draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    winning_number INTEGER,
    status draw_status NOT NULL DEFAULT 'scheduled',
    rng_seed_hash TEXT, -- Hash of the RNG seed for audit
    rng_seed TEXT, -- The actual RNG seed used
    rng_algo TEXT, -- Algorithm used for RNG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    number INTEGER NOT NULL CHECK (number >= 0 AND number <= 999),
    stake DECIMAL(10,2) NOT NULL CHECK (stake > 0),
    status bet_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    type stream_type NOT NULL DEFAULT 'mp4',
    active BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table for dealer balance tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    reference TEXT, -- Reference to bet, refund, or other transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_draws_scheduled_at ON draws(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_bets_dealer_id ON bets(dealer_id);
CREATE INDEX IF NOT EXISTS idx_bets_draw_id ON bets(draw_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at);
CREATE INDEX IF NOT EXISTS idx_streams_active ON streams(active);
CREATE INDEX IF NOT EXISTS idx_streams_order ON streams("order");
CREATE INDEX IF NOT EXISTS idx_transactions_dealer_id ON transactions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Draws policies
CREATE POLICY "Anyone can view draws" ON draws
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify draws" ON draws
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Bets policies
CREATE POLICY "Dealers can view their own bets" ON bets
    FOR SELECT USING (
        dealer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Dealers can create bets" ON bets
    FOR INSERT WITH CHECK (
        dealer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('dealer', 'admin')
        )
    );

CREATE POLICY "Only admins can update bet status" ON bets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Refunds policies
CREATE POLICY "Dealers can view refunds for their bets" ON refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bets 
            WHERE bets.id = refunds.bet_id 
            AND bets.dealer_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can create refunds" ON refunds
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Streams policies
CREATE POLICY "Anyone can view active streams" ON streams
    FOR SELECT USING (active = true);

CREATE POLICY "Only admins can manage streams" ON streams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Transactions policies
CREATE POLICY "Dealers can view their own transactions" ON transactions
    FOR SELECT USING (
        dealer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can create transactions" ON transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Functions for common operations

-- Function to get current draw
CREATE OR REPLACE FUNCTION get_current_draw()
RETURNS TABLE (
    id UUID,
    scheduled_at TIMESTAMP WITH TIME ZONE,
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

-- Function to check if betting is open for a draw
CREATE OR REPLACE FUNCTION is_betting_open(draw_time TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOW() < (draw_time - INTERVAL '15 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate refund amount
CREATE OR REPLACE FUNCTION calculate_refund_amount(bet_amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(bet_amount * 0.20, 2); -- 20% refund
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing
INSERT INTO streams (title, description, url, type, active, "order") VALUES
('Sample Stream 1', 'Entertainment content for lottery clients', 'https://sample-stream-1.com/stream.m3u8', 'hls', true, 1),
('Sample Stream 2', 'More entertainment content', 'https://sample-stream-2.com/stream.m3u8', 'hls', true, 2),
('Sample Stream 3', 'Additional content', 'https://sample-stream-3.com/stream.mp4', 'mp4', true, 3)
ON CONFLICT DO NOTHING;

-- Create a scheduled draw for testing (next hour)
INSERT INTO draws (scheduled_at, status) VALUES
(NOW() + INTERVAL '1 hour', 'scheduled')
ON CONFLICT DO NOTHING;
