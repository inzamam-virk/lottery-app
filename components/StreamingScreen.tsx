import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Video, ResizeMode, VideoRef } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import { useLotteryStore } from '../stores/lotteryStore';
import { useCountdown } from '../hooks/useCountdown';
import { formatPKT, isDrawInProgress, getDrawStatusText } from '../lib/utils/time';
import { UI, LOTTERY_CONFIG } from '../constants';
import { Stream } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StreamingScreenProps {
  onShowResults?: () => void;
}

const StreamingScreen: React.FC<StreamingScreenProps> = ({ onShowResults }) => {
  useKeepAwake(); // Keep screen awake during streaming
  
  const videoRef = useRef<VideoRef>(null);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const {
    currentDraw,
    activeStreams,
    fetchCurrentDraw,
    fetchActiveStreams,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    isLoading,
    error,
  } = useLotteryStore();

  // Countdown to next draw
  const { timeLeft, isComplete } = useCountdown({
    targetTime: currentDraw?.scheduled_at || null,
    onComplete: () => {
      // Draw time reached, show results overlay
      setShowResults(true);
      if (onShowResults) {
        onShowResults();
      }
    },
  });

  useEffect(() => {
    // Initial data fetch
    fetchCurrentDraw();
    fetchActiveStreams();

    // Subscribe to realtime updates
    subscribeToUpdates();

    return () => {
      unsubscribeFromUpdates();
    };
  }, []);

  useEffect(() => {
    // Auto-advance to next stream when current one ends
    if (activeStreams.length > 0 && !isVideoReady && !videoError) {
      const timer = setTimeout(() => {
        setCurrentStreamIndex((prev) => (prev + 1) % activeStreams.length);
      }, 5000); // 5 second delay before switching

      return () => clearTimeout(timer);
    }
  }, [activeStreams, isVideoReady, videoError]);

  const currentStream = activeStreams[currentStreamIndex];

  const handleVideoLoad = () => {
    setIsVideoReady(true);
    setVideoError(null);
  };

  const handleVideoError = (error: string) => {
    console.error('Video error:', error);
    setVideoError(error);
    setIsVideoReady(false);
    
    // Try next stream on error
    setTimeout(() => {
      setCurrentStreamIndex((prev) => (prev + 1) % activeStreams.length);
    }, 2000);
  };

  const handleVideoEnd = () => {
    setIsVideoReady(false);
    // Auto-advance to next stream
    setCurrentStreamIndex((prev) => (prev + 1) % activeStreams.length);
  };

  const getStatusColor = () => {
    if (!currentDraw) return UI.COLORS.TEXT_SECONDARY;
    
    switch (currentDraw.status) {
      case 'scheduled':
        return isDrawInProgress(currentDraw) ? UI.COLORS.WARNING : UI.COLORS.SUCCESS;
      case 'in_progress':
        return UI.COLORS.PRIMARY;
      case 'completed':
        return UI.COLORS.SUCCESS;
      default:
        return UI.COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusText = () => {
    if (!currentDraw) return 'No upcoming draws';
    return getDrawStatusText(currentDraw.status, currentDraw.scheduled_at);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI.COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchCurrentDraw()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Next Draw:</Text>
          <Text style={styles.statusValue}>
            {currentDraw ? formatPKT(currentDraw.scheduled_at, 'HH:mm') : '--:--'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Countdown Timer */}
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownLabel}>Time Until Next Draw</Text>
        <Text style={styles.countdownTimer}>{timeLeft}</Text>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {currentStream ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStream.url }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            onLoad={handleVideoLoad}
            onError={handleVideoError}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                handleVideoEnd();
              }
            }}
            useNativeControls={false}
          />
        ) : (
          <View style={styles.noStreamContainer}>
            <Text style={styles.noStreamText}>No active streams available</Text>
            <Text style={styles.noStreamSubtext}>Please check back later</Text>
          </View>
        )}

        {/* Stream Info Overlay */}
        {currentStream && (
          <View style={styles.streamInfoOverlay}>
            <Text style={styles.streamTitle}>{currentStream.title}</Text>
            <Text style={styles.streamDescription} numberOfLines={2}>
              {currentStream.description}
            </Text>
          </View>
        )}

        {/* Results Overlay */}
        {showResults && (
          <View style={styles.resultsOverlay}>
            <Text style={styles.resultsTitle}>🎯 Draw Results Coming Soon!</Text>
            <Text style={styles.resultsSubtitle}>Please wait while we process the results...</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (videoRef.current) {
              videoRef.current.pauseAsync();
            }
          }}
        >
          <Text style={styles.controlButtonText}>⏸️ Pause</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (videoRef.current) {
              videoRef.current.playAsync();
            }
          }}
        >
          <Text style={styles.controlButtonText}>▶️ Play</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            setCurrentStreamIndex((prev) => (prev + 1) % activeStreams.length);
          }}
        >
          <Text style={styles.controlButtonText}>⏭️ Next</Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {videoError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            Stream Error: {videoError}
          </Text>
          <TouchableOpacity
            style={styles.errorBannerButton}
            onPress={() => {
              setVideoError(null);
              setCurrentStreamIndex((prev) => (prev + 1) % activeStreams.length);
            }}
          >
            <Text style={styles.errorBannerButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.BACKGROUND,
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
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI.COLORS.BACKGROUND,
    padding: UI.SPACING.LG,
  },
  
  errorText: {
    fontSize: 16,
    color: UI.COLORS.ERROR,
    textAlign: 'center',
    marginBottom: UI.SPACING.LG,
  },
  
  retryButton: {
    backgroundColor: UI.COLORS.PRIMARY,
    paddingHorizontal: UI.SPACING.LG,
    paddingVertical: UI.SPACING.MD,
    borderRadius: UI.BORDER_RADIUS.MD,
  },
  
  retryButtonText: {
    color: UI.COLORS.CARD,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: UI.SPACING.MD,
    backgroundColor: UI.COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.BACKGROUND,
  },
  
  statusItem: {
    alignItems: 'center',
  },
  
  statusLabel: {
    fontSize: 12,
    color: UI.COLORS.TEXT_SECONDARY,
    marginBottom: UI.SPACING.XS,
  },
  
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
  },
  
  countdownContainer: {
    alignItems: 'center',
    padding: UI.SPACING.LG,
    backgroundColor: UI.COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.BACKGROUND,
  },
  
  countdownLabel: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
    marginBottom: UI.SPACING.SM,
  },
  
  countdownTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI.COLORS.PRIMARY,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  videoContainer: {
    flex: 1,
    backgroundColor: UI.COLORS.TEXT,
    position: 'relative',
  },
  
  video: {
    width: screenWidth,
    height: '100%',
  },
  
  noStreamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI.COLORS.TEXT,
  },
  
  noStreamText: {
    fontSize: 18,
    color: UI.COLORS.CARD,
    marginBottom: UI.SPACING.SM,
  },
  
  noStreamSubtext: {
    fontSize: 14,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  streamInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: UI.SPACING.MD,
  },
  
  streamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI.COLORS.CARD,
    marginBottom: UI.SPACING.XS,
  },
  
  streamDescription: {
    fontSize: 12,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI.SPACING.XL,
  },
  
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI.COLORS.CARD,
    textAlign: 'center',
    marginBottom: UI.SPACING.MD,
  },
  
  resultsSubtitle: {
    fontSize: 16,
    color: UI.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: UI.SPACING.MD,
    backgroundColor: UI.COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.BACKGROUND,
  },
  
  controlButton: {
    backgroundColor: UI.COLORS.PRIMARY,
    paddingHorizontal: UI.SPACING.MD,
    paddingVertical: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.SM,
    minWidth: 80,
    alignItems: 'center',
  },
  
  controlButtonText: {
    color: UI.COLORS.CARD,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: UI.SPACING.MD,
    right: UI.SPACING.MD,
    backgroundColor: UI.COLORS.ERROR,
    padding: UI.SPACING.MD,
    borderRadius: UI.BORDER_RADIUS.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  errorBannerText: {
    color: UI.COLORS.CARD,
    fontSize: 14,
    flex: 1,
  },
  
  errorBannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: UI.SPACING.MD,
    paddingVertical: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.SM,
  },
  
  errorBannerButtonText: {
    color: UI.COLORS.CARD,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default StreamingScreen;
