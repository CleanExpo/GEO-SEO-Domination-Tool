#!/bin/bash

# Setup script for Vercel Coding Agent Template integration
# This clones and configures the Vercel template for MetaCoder Orchestrator

set -e  # Exit on error

echo "🚀 Setting up Vercel Coding Agent Template for MetaCoder Orchestrator"
echo ""

# Create tools directory if it doesn't exist
mkdir -p tools

# Clone the Vercel template
echo "📦 Cloning Vercel coding-agent-template..."
if [ -d "tools/coding-agent" ]; then
    echo "⚠️  Directory tools/coding-agent already exists. Skipping clone."
else
    git clone https://github.com/vercel-labs/coding-agent-template.git tools/coding-agent
    echo "✅ Template cloned successfully"
fi

cd tools/coding-agent

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
else
    echo "⚠️  pnpm not found. Installing with npm..."
    npm install -g pnpm
    pnpm install
fi

echo "✅ Dependencies installed"

# Create .env file from .env.example
echo ""
echo "🔧 Setting up environment variables..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Vercel Sandbox Configuration
VERCEL_TEAM_ID=your_vercel_team_id
VERCEL_PROJECT_ID=your_vercel_project_id
VERCEL_TOKEN=your_vercel_api_token

# Database (use same Supabase as main app)
POSTGRES_URL=postgresql://postgres:your_password@db.placeholder.supabase.co:5432/postgres

# AI Gateway
AI_GATEWAY_API_KEY=your_ai_gateway_key

# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token

# Claude Code (your Max Plan!)
ANTHROPIC_API_KEY=your_anthropic_key

# Optional: Additional agents
CURSOR_API_KEY=your_cursor_key
GEMINI_API_KEY=your_gemini_key
NPM_TOKEN=your_npm_token
EOF
    echo "✅ Created .env file. Please fill in your actual values!"
else
    echo "⚠️  .env file already exists. Skipping..."
fi

# Setup database schema
echo ""
echo "📊 Setting up database schema..."
echo "Run these commands manually when ready:"
echo "  cd tools/coding-agent"
echo "  pnpm db:generate  # Generate Drizzle migrations"
echo "  pnpm db:push      # Push schema to database"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Edit tools/coding-agent/.env with your actual API keys"
echo "  2. Run: cd tools/coding-agent && pnpm db:push"
echo "  3. Run: pnpm dev (to test the template)"
echo "  4. Integrate with main CRM at /sandbox"
echo ""
echo "📚 Documentation: VERCEL_CODING_AGENT_INTEGRATION.md"
