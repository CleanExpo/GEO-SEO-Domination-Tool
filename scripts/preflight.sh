#!/bin/bash
###############################################################################
# Preflight Validation Script
#
# Runs all validation checks before starting the application.
# Exit code 0 = all checks passed, non-zero = failure
###############################################################################

set -e  # Exit on any error

echo "🚀 Running preflight checks..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
OVERALL_STATUS=0

# 1. Environment variables check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1/4: Checking environment variables..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npx tsx scripts/check-env.ts; then
    echo -e "${GREEN}✅ Environment variables validated${NC}"
else
    echo -e "${RED}❌ Environment validation failed${NC}"
    OVERALL_STATUS=1
fi
echo ""

# 2. Database connectivity and schema
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 2/4: Checking database connectivity and schema..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npx tsx scripts/check-db.ts; then
    echo -e "${GREEN}✅ Database validated${NC}"
else
    echo -e "${RED}❌ Database validation failed${NC}"
    OVERALL_STATUS=1
fi
echo ""

# 3. External API health checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 3/4: Checking external API connectivity..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npx tsx scripts/check-apis.ts; then
    echo -e "${GREEN}✅ APIs validated${NC}"
else
    echo -e "${RED}❌ API validation failed${NC}"
    OVERALL_STATUS=1
fi
echo ""

# 4. Dependencies check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 4/4: Checking dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found, installing dependencies...${NC}"
    npm ci --silent
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old (required: >= $REQUIRED_VERSION)${NC}"
    OVERALL_STATUS=1
else
    echo -e "${GREEN}✅ Node.js version $NODE_VERSION${NC}"
fi

# Check package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    OVERALL_STATUS=1
else
    echo -e "${GREEN}✅ package.json found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Final status
if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL PREFLIGHT CHECKS PASSED!${NC}"
    echo ""
    echo "🎉 Your environment is ready. You can now run:"
    echo "   - npm run dev (development server)"
    echo "   - npm run build (production build)"
    echo ""
    exit 0
else
    echo -e "${RED}❌ PREFLIGHT CHECKS FAILED${NC}"
    echo ""
    echo "❌ Please fix the errors above before proceeding."
    echo ""
    echo "💡 Common fixes:"
    echo "   - Copy .env.example to .env and configure"
    echo "   - Run: npm run db:migrate"
    echo "   - Check your internet connection"
    echo ""
    exit 1
fi
