# Testing Guide for Priority, SLA, and Time Tracking Endpoints

## Quick Start

The server is running on `http://localhost:8000`. You can test the new endpoints in several ways:

## Option 1: Swagger UI (Easiest - Recommended)

1. **Open Swagger UI:**
   ```
   http://localhost:8000/docs
   ```

2. **Authorize yourself:**
   - Click the "Authorize" button (lock icon) at the top
   - Login as admin first: `POST /auth/login`
   - Copy the `access_token` from the response
   - Click "Authorize" again and paste: `Bearer <your_token>`

3. **Test endpoints in order:**
   - `POST /admin/slas` - Create an SLA definition
   - `GET /admin/slas` - List SLA definitions
   - `POST /ticket/{ticket_id}/priority` - Update ticket priority
   - `GET /ticket/{ticket_id}/sla-status` - Get SLA status
   - `POST /ticket/{ticket_id}/time-entry` - Create time entry
   - `GET /ticket/{ticket_id}/time-entries` - Get time entries

## Option 2: Using curl commands

### Step 1: Login as Admin
```bash
# Login and get token
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
```

### Step 2: Create SLA Definition
```bash
curl -X POST "http://localhost:8000/admin/slas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Standard Support SLA",
    "description": "Standard 8-hour response, 48-hour resolution",
    "priority": "medium",
    "response_time_minutes": 480,
    "resolution_time_minutes": 2880,
    "business_hours_only": false
  }'
```

### Step 3: List SLA Definitions
```bash
curl -X GET "http://localhost:8000/admin/slas?is_active=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 4: Login as Customer and Create Ticket
```bash
# Login as customer
CUSTOMER_TOKEN=$(curl -s -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "customer123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Create ticket with priority
TICKET_RESPONSE=$(curl -s -X POST "http://localhost:8000/ticket" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "context": "test",
    "subject": "Test Priority Ticket",
    "message": "This is a test ticket with high priority",
    "priority": "high"
  }')

TICKET_ID=$(echo $TICKET_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['ticket_id'])")
echo "Ticket ID: $TICKET_ID"
```

### Step 5: Update Ticket Priority
```bash
curl -X POST "http://localhost:8000/ticket/$TICKET_ID/priority" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"priority": "urgent"}'
```

### Step 6: Get SLA Status
```bash
curl -X GET "http://localhost:8000/ticket/$TICKET_ID/sla-status" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 7: Create Time Entry
```bash
curl -X POST "http://localhost:8000/ticket/$TICKET_ID/time-entry" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "duration_minutes": 30,
    "description": "Initial investigation",
    "entry_type": "work",
    "billable": true
  }'
```

### Step 8: Get Time Entries
```bash
curl -X GET "http://localhost:8000/ticket/$TICKET_ID/time-entries" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 9: Admin Reply (to trigger first_response_at)
```bash
curl -X POST "http://localhost:8000/ticket/$TICKET_ID/admin/reply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"message": "Thank you for contacting us. We are looking into this issue."}'
```

### Step 10: Check SLA Status Again
```bash
curl -X GET "http://localhost:8000/ticket/$TICKET_ID/sla-status" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Option 3: Using Python Test Script

1. **Edit credentials in test script:**
   ```bash
   # Edit test_priority_sla_endpoints.py
   # Change admin email/password and customer email/password
   ```

2. **Run the test script:**
   ```bash
   python3 test_priority_sla_endpoints.py
   ```

## Test Checklist

- [ ] Create SLA definition for each priority (low, medium, high, urgent)
- [ ] List all SLA definitions
- [ ] Create ticket with priority
- [ ] Update ticket priority (admin only)
- [ ] Get SLA status (should show expected times)
- [ ] Create time entry
- [ ] Get time entries (should show totals)
- [ ] Admin reply (should set first_response_at)
- [ ] Get SLA status again (should show first_response_at was set)
- [ ] Verify SLA violation detection (if time exceeds SLA)

## Expected Results

### SLA Status Response
```json
{
  "sla_defined": true,
  "sla": {
    "id": "...",
    "name": "Standard Support SLA",
    "priority": "medium",
    "response_time_minutes": 480,
    "resolution_time_minutes": 2880
  },
  "response_time": {
    "expected": "2024-01-01T18:00:00",
    "actual": null,
    "violation": null
  },
  "resolution_time": {
    "expected": "2024-01-03T18:00:00",
    "actual": null,
    "violation": null
  }
}
```

### Time Entries Response
```json
{
  "time_entries": [
    {
      "id": "...",
      "ticket_id": "...",
      "user_id": "...",
      "duration_minutes": 30,
      "description": "Initial investigation",
      "entry_type": "work",
      "billable": true,
      "created_at": "..."
    }
  ],
  "totals": {
    "total_minutes": 30,
    "total_hours": 0.5,
    "billable_minutes": 30,
    "billable_hours": 0.5
  }
}
```

## Troubleshooting

1. **"Authentication required" error:**
   - Make sure you're logged in and using the Bearer token
   - Token might be expired, login again

2. **"Ticket not found" error:**
   - Make sure you're using the correct ticket_id
   - Ticket must exist and you must have access

3. **"No SLA definition found" error:**
   - Create an SLA definition first using `POST /admin/slas`
   - Make sure SLA is active and matches ticket priority

4. **Priority validation errors:**
   - Valid priorities are: `low`, `medium`, `high`, `urgent`
   - Case-sensitive

## Next Steps

After testing these endpoints, you can:
1. Test file attachments (when implemented)
2. Test email integration (when implemented)
3. Test knowledge base (when implemented)
4. Test advanced admin features (when implemented)

