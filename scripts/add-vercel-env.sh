#!/bin/bash

# Script to add Supabase environment variables to Vercel
# Run this from the web-app directory: cd web-app && ../scripts/add-vercel-env.sh

echo "════════════════════════════════════════════════════════"
echo "  Adding Supabase Environment Variables to Vercel"
echo "════════════════════════════════════════════════════════"
echo ""

# Get Supabase URL and Key from user
echo "📋 Please provide your Supabase credentials:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/api"
echo "2. Copy the values below:"
echo ""

read -p "Supabase URL (https://qwoggbbavikzhypzodcr.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key (starts with eyJ...): " SUPABASE_ANON_KEY

# Set default if empty
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://qwoggbbavikzhypzodcr.supabase.co"
fi

echo ""
echo "🚀 Adding environment variables..."
echo ""

# Add NEXT_PUBLIC_SUPABASE_URL
echo "Adding NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<EOF
$SUPABASE_URL
EOF

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
echo ""
echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<EOF
$SUPABASE_ANON_KEY
EOF

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Environment variables added!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Redeploy: vercel --prod"
echo "2. Verify: https://geo-seo-domination-tool.vercel.app/"
echo ""
