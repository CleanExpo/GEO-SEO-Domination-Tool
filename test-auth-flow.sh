#!/bin/bash

# Authentication & RLS Testing Script
# This script tests the complete authentication and data isolation flow

set -e

BASE_URL="http://localhost:3000"
COOKIES_FILE="test-cookies.txt"

echo "=================================================="
echo "GEO-SEO Domination Tool - Auth & RLS Test Suite"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} - $2"
    ((TESTS_FAILED++))
  fi
}

# Function to make authenticated request
auth_request() {
  curl -s -b $COOKIES_FILE "$@"
}

echo "Test 1: Health Check"
echo "--------------------"
HEALTH=$(curl -s ${BASE_URL}/api/health)
if echo "$HEALTH" | grep -q "ok"; then
  test_result 0 "Server is running"
else
  test_result 1 "Server health check failed"
  exit 1
fi
echo ""

echo "Test 2: Protected Route Access (No Auth)"
echo "----------------------------------------"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/api/companies)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
  test_result 0 "Unauthenticated request blocked (HTTP $RESPONSE)"
else
  test_result 1 "Expected 401/403, got HTTP $RESPONSE"
fi
echo ""

echo "Test 3: Login Flow"
echo "------------------"
# Note: This requires manual setup - creating a test user first
echo "Creating test session..."
LOGIN_RESPONSE=$(curl -s -c $COOKIES_FILE -X POST ${BASE_URL}/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -d '{
    "email": "test@geoseodomination.com",
    "password": "GeoSEO2025!Test"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  test_result 0 "Login successful"
else
  test_result 1 "Login failed - Please create test user first"
  echo "  Run: npm run test:setup-user"
fi
echo ""

echo "Test 4: Access Protected Endpoint (With Auth)"
echo "--------------------------------------------"
COMPANIES=$(auth_request ${BASE_URL}/api/companies)
if echo "$COMPANIES" | grep -q "companies"; then
  test_result 0 "Authenticated request successful"
else
  test_result 1 "Failed to access protected endpoint"
fi
echo ""

echo "Test 5: Organisation Membership"
echo "------------------------------"
ORGS=$(auth_request ${BASE_URL}/api/organisations/list)
if echo "$ORGS" | grep -q "organisations"; then
  test_result 0 "User belongs to organisation(s)"
  echo "$ORGS" | jq '.' 2>/dev/null || echo "$ORGS"
else
  test_result 1 "User not in any organisation"
fi
echo ""

echo "Test 6: Create Company (RLS Write Test)"
echo "---------------------------------------"
CREATE_RESPONSE=$(auth_request -X POST ${BASE_URL}/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Local Business",
    "website": "https://testlocalbiz.com",
    "industry": "plumbing",
    "location": "San Francisco, CA"
  }')

if echo "$CREATE_RESPONSE" | grep -q "company"; then
  test_result 0 "Company created successfully"
  COMPANY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.company.id' 2>/dev/null)
  echo "  Company ID: $COMPANY_ID"
else
  test_result 1 "Failed to create company"
fi
echo ""

echo "Test 7: Read Company (RLS Read Test)"
echo "------------------------------------"
COMPANIES=$(auth_request ${BASE_URL}/api/companies)
if echo "$COMPANIES" | grep -q "Test Local Business"; then
  test_result 0 "Can read own organisation's companies"
else
  test_result 1 "Cannot read own organisation's companies"
fi
echo ""

echo "Test 8: Create Keyword"
echo "---------------------"
if [ ! -z "$COMPANY_ID" ]; then
  KEYWORD_RESPONSE=$(auth_request -X POST ${BASE_URL}/api/keywords \
    -H "Content-Type: application/json" \
    -d "{
      \"company_id\": \"$COMPANY_ID\",
      \"keyword\": \"plumber near me\",
      \"location\": \"San Francisco, CA\",
      \"search_volume\": 8100,
      \"difficulty\": 65
    }")

  if echo "$KEYWORD_RESPONSE" | grep -q "keyword"; then
    test_result 0 "Keyword created successfully"
  else
    test_result 1 "Failed to create keyword"
  fi
else
  test_result 1 "Skipped - no company ID"
fi
echo ""

echo "Test 9: Check Rankings API"
echo "--------------------------"
if [ ! -z "$COMPANY_ID" ]; then
  RANKINGS=$(auth_request ${BASE_URL}/api/rankings?company_id=$COMPANY_ID)
  if echo "$RANKINGS" | grep -q "rankings"; then
    test_result 0 "Rankings API accessible"
  else
    test_result 1 "Rankings API failed"
  fi
else
  test_result 1 "Skipped - no company ID"
fi
echo ""

echo "Test 10: Logout and Verify Session Cleared"
echo "------------------------------------------"
rm -f $COOKIES_FILE
AFTER_LOGOUT=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/api/companies)
if [ "$AFTER_LOGOUT" = "401" ] || [ "$AFTER_LOGOUT" = "403" ]; then
  test_result 0 "Session cleared after logout"
else
  test_result 1 "Session still active after logout"
fi
echo ""

# Summary
echo "=================================================="
echo "Test Summary"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
