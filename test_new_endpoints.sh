#!/bin/bash
# Test script for new Priority, SLA, and Time Tracking endpoints
# Make sure the server is running: python -m uvicorn main:app --reload

BASE_URL="http://localhost:8000"
echo "Testing new endpoints..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Login as admin
echo -e "${YELLOW}1. Testing admin login...${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Failed to get admin token. Make sure you have an admin account.${NC}"
  echo "Create admin account first or use existing credentials"
  exit 1
fi

echo -e "${GREEN}✓ Admin login successful${NC}"
echo ""

# Test 2: Create SLA Definition
echo -e "${YELLOW}2. Testing SLA definition creation...${NC}"
SLA_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/slas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Standard Support SLA",
    "description": "Standard 8-hour response, 48-hour resolution",
    "priority": "medium",
    "response_time_minutes": 480,
    "resolution_time_minutes": 2880,
    "business_hours_only": false
  }')

echo "$SLA_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SLA_RESPONSE"
echo ""

# Test 3: List SLA Definitions
echo -e "${YELLOW}3. Testing list SLA definitions...${NC}"
curl -s -X GET "$BASE_URL/admin/slas?is_active=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool 2>/dev/null || echo "Response received"
echo ""

# Test 4: Create a ticket (will need customer login)
echo -e "${YELLOW}4. Testing ticket creation with priority...${NC}"
echo "Note: This requires customer login. Create a customer account first."
echo ""

# Test 5: Update ticket priority (need a ticket ID)
echo -e "${YELLOW}5. Testing update ticket priority...${NC}"
echo "Note: Requires a valid ticket_id. Replace TICKET_ID below with actual ID."
echo "curl -X POST \"$BASE_URL/ticket/TICKET_ID/priority\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\" \\"
echo "  -d '{\"priority\": \"high\"}'"
echo ""

# Test 6: Get SLA Status
echo -e "${YELLOW}6. Testing get SLA status...${NC}"
echo "Note: Requires a valid ticket_id. Replace TICKET_ID below with actual ID."
echo "curl -X GET \"$BASE_URL/ticket/TICKET_ID/sla-status\" \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\""
echo ""

# Test 7: Create Time Entry
echo -e "${YELLOW}7. Testing create time entry...${NC}"
echo "Note: Requires a valid ticket_id. Replace TICKET_ID below with actual ID."
echo "curl -X POST \"$BASE_URL/ticket/TICKET_ID/time-entry\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\" \\"
echo "  -d '{"
echo "    \"duration_minutes\": 30,"
echo "    \"description\": \"Initial investigation\","
echo "    \"entry_type\": \"work\","
echo "    \"billable\": true"
echo "  }'"
echo ""

# Test 8: Get Time Entries
echo -e "${YELLOW}8. Testing get time entries...${NC}"
echo "Note: Requires a valid ticket_id. Replace TICKET_ID below with actual ID."
echo "curl -X GET \"$BASE_URL/ticket/TICKET_ID/time-entries\" \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\""
echo ""

echo -e "${GREEN}Testing script complete!${NC}"
echo ""
echo "To test with actual ticket IDs:"
echo "1. Login as customer and create a ticket"
echo "2. Note the ticket_id from the response"
echo "3. Use that ticket_id in the commands above"

