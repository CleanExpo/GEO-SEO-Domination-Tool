#!/bin/bash

# Setup script for GEO Builders MCP Server

set -e

echo "🔧 Setting up GEO Builders MCP Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from tools/geo-builders-mcp/"
  exit 1
fi

# Install dependencies (skip optional to avoid build issues)
echo "📦 Installing dependencies..."
npm install --no-optional

# Build the server with tsc (pure TypeScript, no bundler)
echo "🏗️  Building TypeScript with tsc..."
npm run build

# Verify build
if [ ! -f "dist/index.js" ]; then
  echo "❌ Build failed: dist/index.js not found"
  exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Add to Claude Desktop config (~/.config/claude-code/claude_desktop_config.json):"
echo ""
echo '   "geo-builders": {'
echo '     "command": "node",'
echo "     \"args\": [\"$(pwd)/dist/index.js\"]"
echo '   }'
echo ""
echo "2. Restart Claude Desktop"
echo ""
echo "3. Test with: 'List all available builders'"
echo ""
echo "🎉 Setup complete!"
