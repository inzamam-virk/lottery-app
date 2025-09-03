# LotteryApp

A comprehensive lottery management system built with React Native, Expo, and Supabase. The app features live streaming, dealer management, betting systems, and administrative controls.

## Features

### 🎯 Core Lottery Features
- **Hourly Draws**: Automated draws every hour with configurable timing
- **Number Range**: Support for numbers 0-999
- **Betting System**: 15-minute cutoff before each draw
- **Refund System**: 20% refund for losing bets
- **PKT Timezone**: Pakistan Standard Time support

### 📱 User Portals
- **Public Portal**: Live streaming with countdown timers
- **Dealer Portal**: Client management, bet placement, and tracking
- **Admin Portal**: System management, draw control, and analytics

### 🎥 Streaming Features
- **Multi-format Support**: HLS, MP4, and YouTube streams
- **Auto-playlist**: Seamless content rotation between draws
- **Countdown Display**: Real-time countdown to next draw
- **Results Overlay**: Automatic results display during draw time

### 🔐 Authentication & Security
- **Role-based Access**: Admin, Dealer, and Public roles
- **Row Level Security**: Supabase RLS policies
- **Secure API**: Protected endpoints with proper authorization

## Tech Stack

- **Frontend**: React Native + Expo Router
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: Zustand
- **API Management**: React Query (TanStack Query)
- **Video Streaming**: Expo AV
- **Timezone**: date-fns-tz for PKT support

## Project Structure

```
LotteryApp/
├── app/                    # Expo Router screens
│   ├── (tabs)/           # Main tab navigation
│   ├── login.tsx         # Authentication screen
│   └── _layout.tsx       # Root layout
├── components/            # Reusable UI components
│   ├── StreamingScreen.tsx    # Main streaming interface
│   ├── DealerDashboard.tsx    # Dealer management
│   ├── NewBetForm.tsx         # Bet placement form
│   └── LoginScreen.tsx        # Authentication form
├── stores/                # Zustand state management
│   ├── authStore.ts      # Authentication state
│   └── lotteryStore.ts   # Lottery game state
├── lib/                   # Core libraries
│   ├── supabase/         # Supabase client & config
│   ├── api/              # API endpoints & client
│   └── utils/            # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
├── constants/             # App constants
└── database/              # Database schema
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Expo CLI
- Supabase account
- React Native development environment
- Supabase CLI (for backend deployment)

### 1. Clone and Install
```bash
git clone <repository-url>
cd LotteryApp
npm install
```

### 2. Supabase Setup
1. Create a new Supabase project
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Backend Deployment

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Deploy backend**:
   ```bash
   cd @LotteryApp-Backend
   chmod +x deploy.sh
   ./deploy.sh
   ```

   This will:
   - Set up the database schema
   - Deploy edge functions
   - Configure cron jobs
   - Set up RLS policies

3. **Verify deployment**:
   - Check Supabase dashboard for functions
   - Verify database tables are created
   - Test edge function endpoints

### 4. Database Setup (Alternative)
If you prefer manual setup:
1. Go to your Supabase project SQL Editor
2. Copy and paste the contents of `@LotteryApp-Backend/migrations/001_initial_schema.sql`
3. Execute the SQL to create all tables and policies
4. Run `@LotteryApp-Backend/migrations/002_database_functions.sql` for additional functions

### 4. Configure Supabase
1. Enable Row Level Security (RLS) on all tables
2. Set up authentication providers (Email/Password)
3. Configure realtime subscriptions for:
   - `draws` channel
   - `bets` channel
   - `streams` channel

### 5. Update Stream URLs
1. Go to the `streams` table in Supabase
2. Update the sample stream URLs with your actual streaming URLs
3. Ensure the streams are accessible and in the correct format

### 6. Run the App
```bash
npm start
```

## Configuration

### Lottery Settings
Edit `constants/index.ts` to modify:
- Number range (currently 0-999)
- Draw interval (currently 1 hour)
- Bet cutoff time (currently 15 minutes)
- Refund percentage (currently 20%)

### Timezone
The app is configured for Pakistan Standard Time (PKT). To change:
1. Update `APP_CONFIG.TIMEZONE` in `constants/index.ts`
2. Update the timezone constant in `lib/utils/time.ts`

### Streaming
Configure your streams in the Supabase `streams` table:
- **Title**: Display name for the stream
- **Description**: Additional information
- **URL**: Stream URL (HLS, MP4, or YouTube)
- **Type**: Stream format (hls, mp4, youtube)
- **Active**: Whether the stream should be played
- **Order**: Playback sequence

## API Endpoints

The app uses both Supabase's built-in REST API and custom Edge Functions:

### Edge Functions
- **Schedule Draws**: `POST /functions/v1/schedule-draws` - Create upcoming draws
- **Run Draws**: `POST /functions/v1/run-draws` - Execute draws and process results
- **Manage Streams**: `GET/POST /functions/v1/manage-streams` - Stream content management

### REST API
- **Authentication**: `/auth/v1/*`
- **Users**: `/rest/v1/users`
- **Draws**: `/rest/v1/draws`
- **Bets**: `/rest/v1/bets`
- **Refunds**: `/rest/v1/refunds`
- **Streams**: `/rest/v1/streams`

## Realtime Features

The app subscribes to realtime updates for:
- **Draws**: Live draw status updates
- **Bets**: Real-time bet tracking
- **Streams**: Stream management updates
- **Results**: Draw result notifications

## Development

### Adding New Features
1. Create components in the `components/` directory
2. Add types to `types/index.ts`
3. Update stores if needed
4. Add API endpoints to `lib/api/endpoints.ts`

### Testing
```bash
npm test
```

### Building
```bash
# Android
expo build:android

# iOS
expo build:ios

# Web
expo build:web
```

## Deployment

### Mobile Apps
1. Configure app.json with your app details
2. Build using Expo EAS Build
3. Submit to App Store/Play Store

### Web Version
1. Build the web version
2. Deploy to your preferred hosting service
3. Configure environment variables

## Security Considerations

- **Row Level Security**: All database access is protected by RLS policies
- **Role-based Access**: Users can only access data appropriate to their role
- **Input Validation**: All user inputs are validated on both client and server
- **Secure Authentication**: Supabase handles authentication securely

## Troubleshooting

### Common Issues

1. **Streaming not working**
   - Check stream URLs are accessible
   - Verify stream format is supported
   - Check network permissions

2. **Authentication errors**
   - Verify Supabase credentials
   - Check RLS policies
   - Ensure user roles are set correctly

3. **Realtime not working**
   - Verify Supabase realtime is enabled
   - Check channel subscriptions
   - Verify network connectivity

### Support
For issues and questions:
1. Check the Supabase documentation
2. Review Expo documentation
3. Check React Native troubleshooting guides

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Supabase for the backend infrastructure
- Expo for the React Native framework
- React Native community for components and libraries
