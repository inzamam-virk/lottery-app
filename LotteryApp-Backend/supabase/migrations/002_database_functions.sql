-- Additional Database Functions for LotteryApp
-- Migration: 002_database_functions.sql

-- Function to get dealer statistics
CREATE OR REPLACE FUNCTION get_dealer_stats(dealer_uuid UUID, draw_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_bets BIGINT,
  total_stake DECIMAL(10,2),
  winning_bets BIGINT,
  total_wins DECIMAL(10,2),
  losing_bets BIGINT,
  total_refunds DECIMAL(10,2),
  net_profit DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_bets,
    COALESCE(SUM(stake), 0) as total_stake,
    COUNT(*) FILTER (WHERE status = 'won')::BIGINT as winning_bets,
    COALESCE(SUM(potential_win) FILTER (WHERE status = 'won'), 0) as total_wins,
    COUNT(*) FILTER (WHERE status = 'lost')::BIGINT as losing_bets,
    COALESCE(SUM(refund_amount) FILTER (WHERE status = 'lost'), 0) as total_refunds,
    COALESCE(SUM(potential_win) FILTER (WHERE status = 'won'), 0) - 
    COALESCE(SUM(stake) FILTER (WHERE status = 'lost'), 0) + 
    COALESCE(SUM(refund_amount) FILTER (WHERE status = 'lost'), 0) as net_profit
  FROM bets 
  WHERE dealer_id = dealer_uuid 
    AND (draw_id IS NULL OR draw_id = draw_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get draw statistics
CREATE OR REPLACE FUNCTION get_draw_stats(draw_uuid UUID)
RETURNS TABLE (
  total_bets BIGINT,
  total_stake DECIMAL(10,2),
  winning_bets BIGINT,
  total_wins DECIMAL(10,2),
  losing_bets BIGINT,
  total_refunds DECIMAL(10,2),
  house_edge DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_bets,
    COALESCE(SUM(stake), 0) as total_stake,
    COUNT(*) FILTER (WHERE status = 'won')::BIGINT as winning_bets,
    COALESCE(SUM(potential_win) FILTER (WHERE status = 'won'), 0) as total_wins,
    COUNT(*) FILTER (WHERE status = 'lost')::BIGINT as losing_bets,
    COALESCE(SUM(refund_amount) FILTER (WHERE status = 'lost'), 0) as total_refunds,
    COALESCE(SUM(stake), 0) - COALESCE(SUM(potential_win) FILTER (WHERE status = 'won'), 0) - 
    COALESCE(SUM(refund_amount) FILTER (WHERE status = 'lost'), 0) as house_edge
  FROM bets 
  WHERE draw_id = draw_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next draw time
CREATE OR REPLACE FUNCTION get_next_draw_time()
RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_draw TIMESTAMPTZ;
BEGIN
  SELECT scheduled_at INTO next_draw
  FROM draws 
  WHERE status = 'scheduled' 
    AND scheduled_at > NOW()
  ORDER BY scheduled_at ASC
  LIMIT 1;
  
  RETURN next_draw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if betting is open for a specific draw
CREATE OR REPLACE FUNCTION is_betting_open_for_draw(draw_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  draw_time TIMESTAMPTZ;
BEGIN
  SELECT scheduled_at INTO draw_time
  FROM draws 
  WHERE id = draw_uuid;
  
  IF draw_time IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN draw_time > NOW() + INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active streams with rotation
CREATE OR REPLACE FUNCTION get_active_streams_with_rotation()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  url TEXT,
  type stream_type,
  duration_seconds INTEGER,
  priority INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.url,
    s.type,
    s.duration_seconds,
    s.priority,
    s.created_at
  FROM streams s
  WHERE s.is_active = true
  ORDER BY s.priority ASC, s.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM users 
  WHERE id = user_uuid;
  
  RETURN user_role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate bet data
CREATE OR REPLACE FUNCTION validate_bet(
  bet_number INTEGER,
  bet_stake DECIMAL(10,2),
  bet_draw_id UUID,
  bet_dealer_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  draw_exists BOOLEAN;
  betting_open BOOLEAN;
  dealer_role user_role;
BEGIN
  -- Check if draw exists
  SELECT EXISTS(SELECT 1 FROM draws WHERE id = bet_draw_id) INTO draw_exists;
  IF NOT draw_exists THEN
    RETURN QUERY SELECT FALSE, 'Draw not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if betting is open
  SELECT is_betting_open_for_draw(bet_draw_id) INTO betting_open;
  IF NOT betting_open THEN
    RETURN QUERY SELECT FALSE, 'Betting is closed for this draw'::TEXT;
    RETURN;
  END IF;
  
  -- Check dealer role
  SELECT get_user_role(bet_dealer_id) INTO dealer_role;
  IF dealer_role != 'dealer' AND dealer_role != 'admin' THEN
    RETURN QUERY SELECT FALSE, 'Only dealers can place bets'::TEXT;
    RETURN;
  END IF;
  
  -- Check number range
  IF bet_number < 0 OR bet_number > 999 THEN
    RETURN QUERY SELECT FALSE, 'Number must be between 0 and 999'::TEXT;
    RETURN;
  END IF;
  
  -- Check stake amount
  IF bet_stake <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Stake must be greater than 0'::TEXT;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT TRUE, 'Valid bet'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
