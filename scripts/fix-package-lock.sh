#!/bin/bash
set -e

echo "🔧 Fixing package-lock.json..."
echo ""

# Step 1: Backup existing lock file
if [ -f "package-lock.json" ]; then
  cp package-lock.json package-lock.json.backup
  echo "✅ Backed up existing package-lock.json"
else
  echo "⚠️  No existing package-lock.json found"
fi

# Step 2: Clean slate
echo ""
echo "🧹 Cleaning npm cache and removing lock file..."
rm -f package-lock.json
npm cache clean --force

# Step 3: Regenerate lock file
echo ""
echo "📦 Regenerating package-lock.json..."
npm install

# Step 4: Verify missing dependencies
echo ""
echo "🔍 Verifying previously missing dependencies..."
MISSING=0

check_dependency() {
  if grep -q "\"$1\"" package-lock.json; then
    echo "  ✅ $1 found"
  else
    echo "  ❌ $1 STILL MISSING"
    MISSING=$((MISSING + 1))
  fi
}

check_dependency "@xtuc/ieee754"
check_dependency "ajv-formats"
check_dependency "ajv-keywords"
check_dependency "jest-worker"
check_dependency "terser"
check_dependency "merge-stream"
check_dependency "randombytes"
check_dependency "@jridgewell/source-map"
check_dependency "commander"
check_dependency "serialize-javascript"
check_dependency "supports-color"
check_dependency "buffer-from"
check_dependency "estraverse"
check_dependency "source-map-support"

if [ $MISSING -eq 0 ]; then
  echo ""
  echo "✅ All previously missing dependencies are now present!"
  echo ""
  echo "🧪 Testing npm ci (simulating Vercel)..."
  rm -rf node_modules
  npm ci --omit=dev
  echo "✅ npm ci succeeded!"
  echo ""
  echo "🏗️  Testing build..."
  npm run build
  echo "✅ Build succeeded!"
  echo ""
  echo "🎉 READY TO DEPLOY!"
  echo ""
  echo "Next steps:"
  echo "  1. git add package-lock.json"
  echo "  2. git commit -m \"fix: Complete package-lock.json regeneration\""
  echo "  3. git push origin main"
else
  echo ""
  echo "❌ $MISSING dependencies still missing. Manual investigation required."
  exit 1
fi
