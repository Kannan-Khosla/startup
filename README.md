# AI Support System

A FastAPI-based AI support ticketing system with Supabase integration.

## Project Structure

```
.
├── main.py              # FastAPI application
├── supabase_config.py   # Supabase client configuration
├── index.html           # Frontend interface
├── admin.html           # Admin interface
├── requirements.txt     # Python dependencies
├── database_schema.sql  # Database schema for tickets system
└── clean_database.sql   # Script to wipe all tables
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   Create a `.env` file with:
   ```
   OPENAI_API_KEY=your_openai_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key
   ```

3. **Setup database:**
   - Run `database_schema.sql` in your Supabase SQL Editor
   - Or use `clean_database.sql` to wipe everything clean

4. **Start the server:**
   ```bash
   python -m uvicorn main:app --reload
   ```

## API Endpoints

- `GET /` - Health check
- `POST /ticket` - Create or continue a ticket
- `POST /ticket/{id}/reply` - Reply to existing ticket
- `GET /ticket/{id}` - Get ticket thread
- `GET /stats` - Get ticket statistics
- `GET /admin/tickets` - Admin: list all tickets
- `POST /admin/ticket/{id}/assign` - Admin: assign agent
- `POST /admin/ticket/{id}/close` - Admin: close ticket

## Features

- ✅ AI-powered customer support
- ✅ Ticket threading and history
- ✅ Human agent handoff
- ✅ Admin dashboard
- ✅ Real-time Supabase integration

