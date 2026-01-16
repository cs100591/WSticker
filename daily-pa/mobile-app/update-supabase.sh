#!/bin/bash

# Script to update Supabase credentials for mobile app
# Usage: ./update-supabase.sh YOUR_SUPABASE_URL YOUR_ANON_KEY

if [ "$#" -ne 2 ]; then
    echo "Usage: ./update-supabase.sh YOUR_SUPABASE_URL YOUR_ANON_KEY"
    echo ""
    echo "Example:"
    echo "./update-supabase.sh https://xxxxx.supabase.co eyJhbGc..."
    echo ""
    echo "Get your credentials from: https://supabase.com/dashboard"
    echo "Settings → API → Project URL and anon/public key"
    exit 1
fi

SUPABASE_URL=$1
ANON_KEY=$2

# Update .env file
cat > .env << EOF
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY

# Environment
EXPO_PUBLIC_ENV=development
EOF

echo "✅ Updated mobile-app/.env with your Supabase credentials"
echo ""
echo "Next steps:"
echo "1. Restart Expo server: Press Ctrl+C and run 'npx expo start --clear'"
echo "2. The app will now connect to your Supabase database"
echo "3. You can sign in with your existing accounts"
