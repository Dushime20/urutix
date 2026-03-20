#!/bin/bash

# Broker API Endpoints Test Script
# Usage: ./test-broker-endpoints.sh

BASE_URL="http://localhost:3002/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Broker API Endpoints Test Script"
echo "========================================="
echo ""

# Step 1: Login to get token
echo -e "${YELLOW}Step 1: Login to get authentication token${NC}"
echo "Please enter your credentials:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed. Please check your credentials.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Get all brokers
echo -e "${YELLOW}Step 2: Get all brokers${NC}"
curl -X GET "${BASE_URL}/brokers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Step 3: Create a broker
echo -e "${YELLOW}Step 3: Create a new broker${NC}"
read -p "Broker First Name: " FIRST_NAME
read -p "Broker Last Name: " LAST_NAME
read -p "Broker Email: " BROKER_EMAIL
read -p "Broker Phone (optional): " BROKER_PHONE
read -p "Default Commission Rate % (optional, default 5): " COMMISSION_RATE

COMMISSION_RATE=${COMMISSION_RATE:-5}

CREATE_BODY=$(cat <<EOF
{
  "firstName": "${FIRST_NAME}",
  "lastName": "${LAST_NAME}",
  "email": "${BROKER_EMAIL}",
  "phone": "${BROKER_PHONE}",
  "defaultCommissionRate": ${COMMISSION_RATE}
}
EOF
)

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/brokers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${CREATE_BODY}")

BROKER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$BROKER_ID" ]; then
  echo -e "${RED}❌ Failed to create broker${NC}"
  echo "Response: $CREATE_RESPONSE"
else
  echo -e "${GREEN}✅ Broker created successfully!${NC}"
  echo "Broker ID: $BROKER_ID"
  echo "Response: $CREATE_RESPONSE" | jq '.'
fi
echo ""

# Step 4: Get broker by ID
if [ ! -z "$BROKER_ID" ]; then
  echo -e "${YELLOW}Step 4: Get broker by ID${NC}"
  curl -X GET "${BASE_URL}/brokers/${BROKER_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq '.'
  echo ""
fi

# Step 5: Get broker statistics
if [ ! -z "$BROKER_ID" ]; then
  echo -e "${YELLOW}Step 5: Get broker statistics${NC}"
  curl -X GET "${BASE_URL}/brokers/${BROKER_ID}/statistics" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq '.'
  echo ""
fi

# Step 6: Get broker commissions
if [ ! -z "$BROKER_ID" ]; then
  echo -e "${YELLOW}Step 6: Get broker commissions${NC}"
  curl -X GET "${BASE_URL}/brokers/${BROKER_ID}/commissions" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq '.'
  echo ""
fi

# Step 7: Get broker loads
if [ ! -z "$BROKER_ID" ]; then
  echo -e "${YELLOW}Step 7: Get broker loads${NC}"
  curl -X GET "${BASE_URL}/brokers/${BROKER_ID}/loads" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq '.'
  echo ""
fi

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Test completed!${NC}"
echo "========================================="

