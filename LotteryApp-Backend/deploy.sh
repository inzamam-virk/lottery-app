#!/bin/bash

# LotteryApp Backend Deployment Script
echo "🚀 Deploying LotteryApp Backend to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the @LotteryApp-Backend directory"
    exit 1
fi

# Set environment variables
export SUPABASE_URL="https://zxuylplabznxrvancmxw.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dXlscGxhYnpueHJ2YW5jbXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTA5OCwiZXhwIjoyMDcxMjg1MDk4fQ.lOsB83KuKUb_go4K7PJPsjZ55Njx0qodNqqlbwA3Ong"

echo "📡 Connecting to Supabase project..."

# Link to existing project
supabase link --project-ref zxuylplabznxrvancmxw

echo "🗄️ Running database migrations..."

# Run migrations
supabase db push

echo "⚡ Deploying Edge Functions..."

# Deploy edge functions
supabase functions deploy schedule-draws
supabase functions deploy run-draws
supabase functions deploy manage-streams

echo "⏰ Setting up cron jobs..."

# Deploy cron configuration
supabase functions deploy cron

echo "✅ Deployment completed successfully!"
echo ""
echo "🔗 Your functions are available at:"
echo "  - Schedule Draws: https://zxuylplabznxrvancmxw.supabase.co/functions/v1/schedule-draws"
echo "  - Run Draws: https://zxuylplabznxrvancmxw.supabase.co/functions/v1/run-draws"
echo "  - Manage Streams: https://zxuylplabznxrvancmxw.supabase.co/functions/v1/manage-streams"
echo ""
echo "📊 Check your Supabase dashboard for monitoring and logs."
