import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useLotteryStore } from '../stores/lotteryStore';
import { UI } from '../constants';

const { width, height } = Dimensions.get('window');

interface Stream {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url?: string;
  duration?: number;
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { currentDraw, upcomingDraws, activeStreams } = useLotteryStore();
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);


  // Real working video streams (public domain content)
  const sampleStreams: Stream[] = [
    {
      id: '1',
      title: 'Big Buck Bunny',
      description: 'An animated short film by the Blender Institute',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      id: '2',
      title: 'Elephant Dream',
      description: 'The world\'s first open movie from Blender Foundation',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      id: '3',
      title: 'Sintel',
      description: 'A short film by the Blender Institute',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
    {
      id: '4',
      title: 'Tears of Steel',
      description: 'A sci-fi short film by the Blender Foundation',
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    },
  ];

  const streams = activeStreams.length > 0 ? activeStreams : sampleStreams;

  useEffect(() => {
    // Auto-rotate streams every 5 minutes
    const interval = setInterval(() => {
      setCurrentStreamIndex((prev) => (prev + 1) % streams.length);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [streams.length]);

  const handleLoginPress = () => {
    if (isAuthenticated) {
      // Show user menu or go to profile
      Alert.alert('User Menu', 'What would you like to do?', [
        { text: 'View Profile', onPress: () => console.log('View Profile') },
        { text: 'Sign Out', onPress: () => useAuthStore.getState().signOut() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      router.push('/login');
    }
  };





  const currentStream = streams[currentStreamIndex];

  return (
    <View style={styles.container}>
      {/* Header with Login Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>LotteryApp</Text>
          <Text style={styles.appSubtitle}>Live Entertainment & Lottery</Text>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
          <Ionicons 
            name={isAuthenticated ? 'person-circle' : 'log-in'} 
            size={24} 
            color={UI.COLORS.WHITE} 
          />
          <Text style={styles.loginButtonText}>
            {isAuthenticated ? user?.email || 'Profile' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: currentStream.url }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={isPlaying}
            onError={(error) => {
              console.error('Video error:', error);
              Alert.alert('Video Error', 'Failed to load video. Trying next stream...');
              setCurrentStreamIndex((prev) => (prev + 1) % streams.length);
            }}
          />
          
          {/* Video Info Overlay */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{currentStream.title}</Text>
            <Text style={styles.videoDescription}>{currentStream.description}</Text>
                          <View style={styles.videoControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setIsPlaying(!isPlaying)}
                >
                  <Ionicons 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={20} 
                    color={UI.COLORS.WHITE} 
                  />
                </TouchableOpacity>
              </View>
          </View>
        </View>

        {/* Lottery Information */}
        <View style={styles.lotterySection}>
          <Text style={styles.sectionTitle}>🎯 Next Lottery Draw</Text>
          {currentDraw ? (
            <View style={styles.drawInfo}>
              <Text style={styles.drawTime}>
                Draw Time: {new Date(currentDraw.scheduled_at).toLocaleString()}
              </Text>
              <Text style={styles.drawStatus}>
                Status: {currentDraw.status}
              </Text>
            </View>
          ) : (
            <Text style={styles.noDraw}>No active draw at the moment</Text>
          )}
        </View>

        {/* Stream Navigation */}
        <View style={styles.streamNavigation}>
          <Text style={styles.sectionTitle}>📺 Available Streams</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {streams.map((stream, index) => (
              <TouchableOpacity
                key={stream.id}
                style={[
                  styles.streamThumbnail,
                  index === currentStreamIndex && styles.activeStreamThumbnail,
                ]}
                onPress={() => setCurrentStreamIndex(index)}
              >
                <Text style={styles.streamThumbnailTitle}>{stream.title}</Text>
                <Text style={styles.streamThumbnailDescription}>
                  {stream.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Play?</Text>
          <Text style={styles.ctaDescription}>
            Join our lottery community and enjoy live entertainment between draws!
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.ctaButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI.SPACING.MD,
    paddingTop: UI.SPACING.LG,
    paddingBottom: UI.SPACING.MD,
    backgroundColor: UI.COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.BORDER,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: UI.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: UI.COLORS.PRIMARY,
  },
  appSubtitle: {
    fontSize: UI.FONT_SIZES.SM,
    color: UI.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.COLORS.PRIMARY,
    paddingHorizontal: UI.SPACING.MD,
    paddingVertical: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.MD,
  },
  loginButtonText: {
    color: UI.COLORS.WHITE,
    marginLeft: UI.SPACING.XS,
    fontSize: UI.FONT_SIZES.SM,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    height: height * 0.4,
    backgroundColor: UI.COLORS.BACKGROUND,
    marginBottom: UI.SPACING.MD,
  },
  video: {
    flex: 1,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: UI.SPACING.MD,
  },
  videoTitle: {
    color: UI.COLORS.WHITE,
    fontSize: UI.FONT_SIZES.LG,
    fontWeight: 'bold',
    marginBottom: UI.SPACING.XS,
  },
  videoDescription: {
    color: UI.COLORS.WHITE,
    fontSize: UI.FONT_SIZES.SM,
    marginBottom: UI.SPACING.SM,
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: UI.SPACING.SM,
    borderRadius: UI.BORDER_RADIUS.SM,
    marginRight: UI.SPACING.SM,
  },

  lotterySection: {
    backgroundColor: UI.COLORS.CARD,
    margin: UI.SPACING.MD,
    padding: UI.SPACING.MD,
    borderRadius: UI.BORDER_RADIUS.MD,
  },
  sectionTitle: {
    fontSize: UI.FONT_SIZES.LG,
    fontWeight: 'bold',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.SM,
  },
  drawInfo: {
    marginTop: UI.SPACING.SM,
  },
  drawTime: {
    fontSize: UI.FONT_SIZES.MD,
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.XS,
  },
  drawStatus: {
    fontSize: UI.FONT_SIZES.SM,
    color: UI.COLORS.SUCCESS,
    fontWeight: '600',
  },
  noDraw: {
    fontSize: UI.FONT_SIZES.MD,
    color: UI.COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  streamNavigation: {
    margin: UI.SPACING.MD,
  },
  streamThumbnail: {
    backgroundColor: UI.COLORS.CARD,
    padding: UI.SPACING.MD,
    marginRight: UI.SPACING.MD,
    borderRadius: UI.BORDER_RADIUS.MD,
    minWidth: 150,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeStreamThumbnail: {
    borderColor: UI.COLORS.PRIMARY,
  },
  streamThumbnailTitle: {
    fontSize: UI.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI.COLORS.TEXT,
    marginBottom: UI.SPACING.XS,
  },
  streamThumbnailDescription: {
    fontSize: UI.FONT_SIZES.SM,
    color: UI.COLORS.TEXT_SECONDARY,
  },
  ctaSection: {
    backgroundColor: UI.COLORS.PRIMARY,
    margin: UI.SPACING.MD,
    padding: UI.SPACING.LG,
    borderRadius: UI.BORDER_RADIUS.LG,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: UI.FONT_SIZES.XL,
    fontWeight: 'bold',
    color: UI.COLORS.WHITE,
    marginBottom: UI.SPACING.SM,
  },
  ctaDescription: {
    fontSize: UI.FONT_SIZES.MD,
    color: UI.COLORS.WHITE,
    textAlign: 'center',
    marginBottom: UI.SPACING.LG,
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: UI.COLORS.WHITE,
    paddingHorizontal: UI.SPACING.LG,
    paddingVertical: UI.SPACING.MD,
    borderRadius: UI.BORDER_RADIUS.MD,
  },
  ctaButtonText: {
    color: UI.COLORS.PRIMARY,
    fontSize: UI.FONT_SIZES.MD,
    fontWeight: '600',
  },
});
