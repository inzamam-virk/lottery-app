# LotteryApp Backend

This directory contains the complete Supabase backend implementation for the LotteryApp, including database migrations, edge functions, and deployment configuration.

## 🏗️ Architecture

The backend is built using Supabase with the following components:

- **PostgreSQL Database**: Core data storage with RLS policies
- **Edge Functions**: Serverless functions for business logic
- **Realtime**: Live updates for draws, bets, and streams
- **Auth**: User authentication and role-based access control

## 📁 Directory Structure

```
@LotteryApp-Backend/
├── migrations/                 # Database schema and functions
│   ├── 001_initial_schema.sql # Initial database setup
│   └── 002_database_functions.sql # Additional functions
├── functions/                  # Supabase Edge Functions
│   ├── schedule-draws/        # Schedule upcoming draws
│   ├── run-draws/            # Execute draws and process results
│   └── manage-streams/       # Manage streaming content
├── supabase/                  # Supabase configuration
│   ├── config.toml           # Local development config
│   └── functions/            # Function-specific configs
├── deploy.sh                  # Deployment script
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Supabase CLI**: Install globally
   ```bash
   npm install -g supabase
   ```

2. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)

3. **Project Access**: Ensure you have access to the LotteryApp project

### Deployment

1. **Navigate to backend directory**:
   ```bash
   cd @LotteryApp-Backend
   ```

2. **Make deployment script executable**:
   ```bash
   chmod +x deploy.sh
   ```

3. **Run deployment**:
   ```bash
   ./deploy.sh
   ```

The deployment script will:
- Link to your Supabase project
- Run database migrations
- Deploy edge functions
- Set up cron jobs

## 🗄️ Database Schema

### Core Tables

- **users**: User profiles and roles (admin, dealer, public)
- **draws**: Lottery draws with scheduling and results
- **bets**: Client bets placed through dealers
- **refunds**: 20% refund records for losing bets
- **streams**: Entertainment content for between draws
- **transactions**: Audit trail for all operations

### Key Features

- **Row Level Security (RLS)**: Enforces role-based access
- **Automatic timestamps**: `created_at` and `updated_at` triggers
- **Data validation**: Constraints and check functions
- **Performance indexes**: Optimized for common queries

## ⚡ Edge Functions

### schedule-draws
- **Purpose**: Creates upcoming draws every hour in PKT timezone
- **Trigger**: Cron job every hour
- **Logic**: Ensures next N hourly draws exist

### run-draws
- **Purpose**: Executes draws at scheduled time
- **Trigger**: Cron job every hour
- **Logic**: 
  - Generates winning numbers (0-999)
  - Processes all bets
  - Calculates wins and 20% refunds
  - Updates draw status

### manage-streams
- **Purpose**: Manages streaming content from Internet Archive
- **Endpoints**:
  - `GET`: Retrieve active streams
  - `POST`: Search, add, update, delete streams
- **Features**: Content rotation, priority management

## ⏰ Cron Jobs

The system uses Supabase cron jobs for automation:

```json
{
  "schedule-draws": "0 * * * *",  // Every hour
  "run-draws": "0 * * * *"        // Every hour
}
```

**Note**: Cron runs in UTC, but functions handle PKT timezone conversion internally.

## 🔐 Security

### Row Level Security (RLS)

- **Public users**: Can view draws and active streams
- **Dealers**: Can manage their own bets and view refunds
- **Admins**: Full access to all data and operations

### Authentication

- Email/password authentication
- JWT tokens for API access
- Role-based permissions

## 🌐 API Endpoints

### Edge Functions
- `POST /functions/v1/schedule-draws` - Schedule new draws
- `POST /functions/v1/run-draws` - Execute due draws
- `GET /functions/v1/manage-streams` - Get active streams
- `POST /functions/v1/manage-streams` - Manage streams

### Database Tables
- `GET /rest/v1/draws` - Query draws
- `GET /rest/v1/bets` - Query bets
- `GET /rest/v1/streams` - Query streams
- `POST /rest/v1/bets` - Create new bets

## 📊 Monitoring

### Supabase Dashboard
- **Database**: View tables, run queries, monitor performance
- **Edge Functions**: View logs and execution metrics
- **Auth**: Monitor user sign-ups and sessions
- **Realtime**: Track subscription activity

### Logs
Edge function logs are available in the Supabase dashboard under:
- **Edge Functions** → **Function Name** → **Logs**

## 🛠️ Development

### Local Development

1. **Start local Supabase**:
   ```bash
   supabase start
   ```

2. **Apply migrations**:
   ```bash
   supabase db reset
   ```

3. **Test functions locally**:
   ```bash
   supabase functions serve
   ```

### Testing Edge Functions

Test functions using the Supabase dashboard or curl:

```bash
# Test schedule-draws
curl -X POST "https://zxuylplabznxrvancmxw.supabase.co/functions/v1/schedule-draws" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test manage-streams
curl "https://zxuylplabznxrvancmxw.supabase.co/functions/v1/manage-streams" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 🔧 Configuration

### Environment Variables

The backend uses these environment variables:

```bash
SUPABASE_URL=https://zxuylplabznxrvancmxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LOTTERY_TIMEZONE=Asia/Karachi
LOTTERY_DRAW_INTERVAL_HOURS=1
LOTTERY_BET_CUTOFF_MINUTES=15
LOTTERY_REFUND_PERCENTAGE=20
```

### Lottery Settings

- **Draw Interval**: Every hour (configurable)
- **Bet Cutoff**: 15 minutes before draw
- **Number Range**: 0-999
- **Refund**: 20% for losing bets
- **Timezone**: Pakistan Standard Time (PKT)

## 🚨 Troubleshooting

### Common Issues

1. **Function deployment fails**:
   - Check Supabase CLI version
   - Verify project linking
   - Check function logs

2. **Database connection errors**:
   - Verify environment variables
   - Check RLS policies
   - Ensure proper authentication

3. **Cron jobs not running**:
   - Verify cron configuration
   - Check function logs
   - Ensure functions are deployed

### Debug Mode

Enable detailed logging in edge functions by adding:

```typescript
console.log('Debug info:', { variable, data });
```

## 📈 Performance

### Optimization Tips

- **Database indexes**: Already configured for common queries
- **Function caching**: Implement if needed for heavy operations
- **Batch operations**: Use for bulk data processing
- **Connection pooling**: Supabase handles automatically

### Monitoring

- **Response times**: Track in Supabase dashboard
- **Error rates**: Monitor function logs
- **Database performance**: Use Supabase analytics

## 🔄 Updates

### Schema Changes

1. Create new migration file
2. Test locally first
3. Deploy to staging
4. Deploy to production

### Function Updates

1. Modify function code
2. Test locally
3. Deploy with `supabase functions deploy`

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Database Guide](https://supabase.com/docs/guides/database)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Support

For backend issues:

1. Check function logs in Supabase dashboard
2. Review database queries and RLS policies
3. Test functions locally
4. Check Supabase status page

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: LotteryApp Team
