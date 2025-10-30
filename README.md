# AI Support System

A FastAPI-based AI support ticketing system with Supabase integration.

## Project Structure

```
.
├── main.py              # FastAPI application
├── supabase_config.py   # Supabase client configuration
├── tester.html          # Frontend interface (chat UI + admin actions)
├── docs/                # Project documentation
│   ├── README.md        # Docs index
│   ├── apis.md          # API reference and examples
│   ├── architecture.md  # Architecture and flow diagrams
│   ├── database.md      # Schema and ER diagrams
│   └── development.md   # Setup and conventions
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
   # Optional: Protect admin endpoints (assign/close). If unset, auth is disabled.
   ADMIN_TOKEN=choose_a_secure_token
    # Optional: AI reply rate limiting (defaults shown)
    AI_REPLY_WINDOW_SECONDS=60
    AI_REPLY_MAX_PER_WINDOW=2
   ```

3. **Setup database:**
   - Run `database_schema.sql` in your Supabase SQL Editor
   - Or use `clean_database.sql` to wipe everything clean

4. **Start the server:**
   ```bash
   python -m uvicorn main:app --reload
   ```

5. **View docs:**
   - Local docs: open `docs/index.md` in a Markdown viewer
   - Swagger UI: `http://localhost:8000/docs`
   - Redoc: `http://localhost:8000/redoc`
   - OpenAPI JSON: `http://localhost:8000/openapi.json`

## Publish docs to GitHub Pages
1. Commit and push the `docs/` directory
2. In GitHub → Settings → Pages → Build and deployment:
   - Source: Deploy from a branch
   - Branch: `main` and folder `/docs`
3. Save. Your site will be at `https://<org-or-user>.github.io/<repo>/`

## API Endpoints

- `GET /` - Health check
- `POST /ticket` - Create or continue a ticket
- `POST /ticket/{id}/reply` - Reply to existing ticket
- `GET /ticket/{id}` - Get ticket thread
- `GET /stats` - Get ticket statistics
- `GET /admin/tickets` - Admin: list all tickets
- `POST /admin/ticket/{id}/assign` - Admin: assign agent (requires `X-Admin-Token` header when `ADMIN_TOKEN` is set)
- `POST /admin/ticket/{id}/close` - Admin: close ticket (requires `X-Admin-Token` header when `ADMIN_TOKEN` is set)

## Features

- ✅ AI-powered customer support
- ✅ Ticket threading and history
- ✅ Human agent handoff
- ✅ Admin-protected actions (assign/close) via token header
- ✅ Guardrails: per-ticket AI rate limit, profanity/PII redaction, retry/backoff
- ✅ Real-time Supabase integration

