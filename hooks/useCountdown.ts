import { useState, useEffect, useCallback } from 'react';
import { formatCountdown } from '../lib/utils/time';

interface UseCountdownProps {
  targetTime: Date | string | null;
  onComplete?: () => void;
  interval?: number; // milliseconds
}

interface UseCountdownReturn {
  timeLeft: string;
  timeLeftMs: number;
  isComplete: boolean;
  reset: () => void;
}

export const useCountdown = ({
  targetTime,
  onComplete,
  interval = 1000,
}: UseCountdownProps): UseCountdownReturn => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const calculateTimeLeft = useCallback(() => {
    if (!targetTime) {
      setTimeLeftMs(0);
      setIsComplete(true);
      return;
    }

    const target = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
    const now = new Date();
    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      setTimeLeftMs(0);
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    } else {
      setTimeLeftMs(difference);
      setIsComplete(false);
    }
  }, [targetTime, onComplete]);

  const reset = useCallback(() => {
    setIsComplete(false);
    calculateTimeLeft();
  }, [calculateTimeLeft]);

  useEffect(() => {
    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, interval);

    return () => clearInterval(timer);
  }, [targetTime, interval, calculateTimeLeft]);

  return {
    timeLeft: formatCountdown(timeLeftMs),
    timeLeftMs,
    isComplete,
    reset,
  };
};
