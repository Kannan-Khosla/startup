# Development Guide

## Setup
1. Create `.env` next to `main.py`:
```
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
ADMIN_TOKEN=...
AI_REPLY_WINDOW_SECONDS=60
AI_REPLY_MAX_PER_WINDOW=2
```
2. Install deps: `pip install -r requirements.txt`
3. Run API: `python -m uvicorn main:app --reload`
4. Open UI: `tester.html`

## Useful endpoints
- `/docs` Swagger UI
- `/openapi.json` OpenAPI schema

## Coding conventions
- Keep endpoints thin; prefer helpers for shared logic
- Log errors with clear context; avoid silent excepts
- Update `docs/` in the same PR as code changes

## Testing tips
- Use `ADMIN_TOKEN` to protect admin actions
- Simulate rate limit by sending multiple replies quickly
- Verify redactions by including emails/phones in test prompts
