# Fix Admin Reply Error

## Issue
The admin reply endpoint is failing with:
```
'new row for relation "messages" violates check constraint "messages_sender_check"'
```

This means the `messages` table has a CHECK constraint that doesn't allow "admin" as a sender value.

## Solution

Run migration `007_fix_messages_sender_constraint.sql` in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `migrations/007_fix_messages_sender_constraint.sql`
3. Click "Run"

This migration will:
- Drop the old constraint that only allows 'customer' and 'ai'
- Add a new constraint that allows 'customer', 'ai', and 'admin'

## After Running the Migration

The admin reply endpoint should work correctly. Test it again with:
```bash
python3 test_priority_sla_endpoints.py
```

Or use Swagger UI at http://localhost:8000/docs

