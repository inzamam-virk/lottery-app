import { format, formatDistanceToNow, parseISO, addHours, startOfHour } from 'date-fns';
import { LOTTERY_CONFIG } from '../../constants';

const PKT_OFFSET_HOURS = 5; // PKT is UTC+5

/**
 * Convert UTC date to PKT timezone (UTC+5)
 */
export const toPKT = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return new Date(dateObj.getTime() + (PKT_OFFSET_HOURS * 60 * 60 * 1000));
};

/**
 * Convert PKT date to UTC
 */
export const toUTC = (date: Date): Date => {
  return new Date(date.getTime() - (PKT_OFFSET_HOURS * 60 * 60 * 1000));
};

/**
 * Get current time in PKT
 */
export const getCurrentPKT = (): Date => {
  return new Date(Date.now() + (PKT_OFFSET_HOURS * 60 * 60 * 1000));
};

/**
 * Format date in PKT timezone
 */
export const formatPKT = (date: Date | string, formatString: string = 'PPpp'): string => {
  const pktDate = toPKT(date);
  return format(pktDate, formatString);
};

/**
 * Get time until next draw
 */
export const getTimeUntilDraw = (drawTime: Date | string): number => {
  const drawDate = typeof drawTime === 'string' ? parseISO(drawTime) : drawTime;
  const now = new Date();
  return Math.max(0, drawDate.getTime() - now.getTime());
};

/**
 * Format countdown timer
 */
export const formatCountdown = (milliseconds: number): string => {
  if (milliseconds <= 0) return '00:00:00';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get next draw time (top of the next hour)
 */
export const getNextDrawTime = (): Date => {
  const now = getCurrentPKT();
  const nextHour = startOfHour(addHours(now, 1));
  return toUTC(nextHour); // Convert back to UTC for storage
};

/**
 * Check if betting is currently open
 */
export const isBettingOpen = (drawTime: Date | string): boolean => {
  const drawDate = typeof drawTime === 'string' ? parseISO(drawTime) : drawTime;
  const now = getCurrentPKT();
  const cutOffTime = new Date(drawDate.getTime() - (LOTTERY_CONFIG.BET_CUTOFF_MINUTES * 60 * 1000));
  
  return now < cutOffTime;
};

/**
 * Get betting cut-off time for a draw
 */
export const getBettingCutOffTime = (drawTime: Date | string): Date => {
  const drawDate = typeof drawTime === 'string' ? parseISO(drawTime) : drawTime;
  return new Date(drawDate.getTime() - (LOTTERY_CONFIG.BET_CUTOFF_MINUTES * 60 * 1000));
};

/**
 * Format relative time (e.g., "in 2 hours", "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Check if a draw is currently in progress
 */
export const isDrawInProgress = (draw: { scheduled_at: string; status: string }): boolean => {
  const now = getCurrentPKT();
  const drawTime = parseISO(draw.scheduled_at);
  const drawEndTime = new Date(drawTime.getTime() + (15 * 60 * 1000)); // 15 minutes duration
  
  return draw.status === 'in_progress' && now >= drawTime && now <= drawEndTime;
};

/**
 * Get draw status display text
 */
export const getDrawStatusText = (status: string, scheduledAt: string): string => {
  switch (status) {
    case 'scheduled':
      return isBettingOpen(scheduledAt) ? 'Betting Open' : 'Betting Closed';
    case 'in_progress':
      return 'Draw in Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};
