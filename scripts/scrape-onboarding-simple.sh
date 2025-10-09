#!/bin/bash

echo "🎭 Using Playwright MCP to scrape onboarding page..."
echo ""

# Use curl to test the page directly first
echo "=== TESTING PAGE ACCESS ==="
curl -s -I https://geo-seo-domination-tool.vercel.app/onboarding/new | head -10
echo ""

echo "=== FETCHING PAGE HTML ==="
curl -s https://geo-seo-domination-tool.vercel.app/onboarding/new > /tmp/onboarding-page.html
echo "✅ Downloaded page HTML ($(wc -c < /tmp/onboarding-page.html) bytes)"
echo ""

echo "=== ANALYZING PAGE STRUCTURE ==="
echo "Forms found:"
grep -o '<form[^>]*>' /tmp/onboarding-page.html | head -5
echo ""

echo "Input fields:"
grep -o '<input[^>]*>' /tmp/onboarding-page.html | head -10
echo ""

echo "Buttons:"
grep -o '<button[^>]*>[^<]*</button>' /tmp/onboarding-page.html | head -10
echo ""

echo "JavaScript errors or console logs in page:"
grep -i 'console\|error' /tmp/onboarding-page.html | grep -v 'node_modules' | head -10
echo ""

echo "API endpoints referenced:"
grep -o '/api/[^"'\'' ]*' /tmp/onboarding-page.html | sort -u
echo ""

echo "=== TESTING API ENDPOINT DIRECTLY ==="
echo "Testing: POST /api/onboarding/save"
curl -X POST https://geo-seo-domination-tool.vercel.app/api/onboarding/save \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Scrape Test","email":"scrape@test.com","formData":{},"currentStep":1}' \
  -w "\nStatus: %{http_code}\n"

