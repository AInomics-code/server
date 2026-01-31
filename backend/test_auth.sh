#!/bin/bash
# Test script for user authentication module
# Run with: bash test_auth.sh

set -e

BASE_URL="http://localhost:8000"
ADMIN_EMAIL="admin@vorta.com"
ADMIN_PASSWORD="admin123"

echo "================================"
echo "Testing User Authentication API"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health check
echo "1. Testing health endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" ${BASE_URL}/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# Test 2: Login with admin credentials
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "Token obtained: ${ACCESS_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Login failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $LOGIN_BODY"
    exit 1
fi
echo ""

# Test 3: Get current user
echo "3. Testing get current user..."
ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET ${BASE_URL}/api/auth/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n 1)
ME_BODY=$(echo "$ME_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get current user successful${NC}"
    echo "User: $ME_BODY"
else
    echo -e "${RED}✗ Get current user failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $ME_BODY"
    exit 1
fi
echo ""

# Test 4: Create a new user (admin only)
echo "4. Testing create user (admin only)..."
NEW_USER_EMAIL="test.user@example.com"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/users \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"${NEW_USER_EMAIL}\",
    \"password\":\"testpass123\",
    \"name\":\"Test\",
    \"last_name\":\"User\",
    \"admin\":false
  }")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n 1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ User created successfully${NC}"
    USER_ID=$(echo "$CREATE_BODY" | grep -o '"user_id":"[^"]*' | cut -d'"' -f4)
    echo "New user ID: $USER_ID"
else
    echo -e "${RED}✗ User creation failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $CREATE_BODY"
fi
echo ""

# Test 5: List all users (admin only)
echo "5. Testing list users (admin only)..."
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET ${BASE_URL}/api/users \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

HTTP_CODE=$(echo "$LIST_RESPONSE" | tail -n 1)
LIST_BODY=$(echo "$LIST_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ List users successful${NC}"
    USER_COUNT=$(echo "$LIST_BODY" | grep -o '"user_id"' | wc -l)
    echo "Total users: $USER_COUNT"
else
    echo -e "${RED}✗ List users failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $LIST_BODY"
fi
echo ""

# Test 6: Login with new user
echo "6. Testing login with new user..."
NEW_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${NEW_USER_EMAIL}\",\"password\":\"testpass123\"}")

HTTP_CODE=$(echo "$NEW_LOGIN_RESPONSE" | tail -n 1)
NEW_LOGIN_BODY=$(echo "$NEW_LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ New user login successful${NC}"
    NEW_ACCESS_TOKEN=$(echo "$NEW_LOGIN_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "New user token obtained"
else
    echo -e "${RED}✗ New user login failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $NEW_LOGIN_BODY"
fi
echo ""

# Test 7: Try to create user with non-admin account (should fail)
echo "7. Testing create user with non-admin account (should fail)..."
FORBIDDEN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/users \
  -H "Authorization: Bearer ${NEW_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"another@example.com\",
    \"password\":\"password123\",
    \"name\":\"Another\",
    \"last_name\":\"User\",
    \"admin\":false
  }")

HTTP_CODE=$(echo "$FORBIDDEN_RESPONSE" | tail -n 1)
FORBIDDEN_BODY=$(echo "$FORBIDDEN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✓ Access correctly denied (HTTP 403)${NC}"
    echo "Response: $FORBIDDEN_BODY"
else
    echo -e "${RED}✗ Expected 403, got HTTP $HTTP_CODE${NC}"
    echo "Response: $FORBIDDEN_BODY"
fi
echo ""

# Test 8: Test protected query endpoint
echo "8. Testing protected query endpoint..."
QUERY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_URL}/api/query \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"test query\"}")

HTTP_CODE=$(echo "$QUERY_RESPONSE" | tail -n 1)
QUERY_BODY=$(echo "$QUERY_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Query endpoint accessible with token${NC}"
else
    echo -e "${RED}✗ Query endpoint failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $QUERY_BODY"
fi
echo ""

# Test 9: Update user (admin only)
if [ -n "$USER_ID" ]; then
    echo "9. Testing update user (admin only)..."
    UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT ${BASE_URL}/api/users/${USER_ID} \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Updated\"}")

    HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n 1)
    UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ User updated successfully${NC}"
    else
        echo -e "${RED}✗ User update failed (HTTP $HTTP_CODE)${NC}"
        echo "Response: $UPDATE_BODY"
    fi
    echo ""

    # Test 10: Delete user (admin only)
    echo "10. Testing delete user (admin only)..."
    DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE ${BASE_URL}/api/users/${USER_ID} \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")

    HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n 1)

    if [ "$HTTP_CODE" = "204" ]; then
        echo -e "${GREEN}✓ User deleted successfully${NC}"
    else
        echo -e "${RED}✗ User deletion failed (HTTP $HTTP_CODE)${NC}"
    fi
    echo ""
fi

echo "================================"
echo "All tests completed!"
echo "================================"
