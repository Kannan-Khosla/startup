# OpenAPI & Examples

Live schema is served by FastAPI:
- Swagger UI: `/docs`
- Redoc: `/redoc`
- Raw JSON: `/openapi.json`

## How to export schema
You can save the schema locally with curl:
```bash
curl -s http://localhost:8000/openapi.json -o docs/openapi.json
```

## Common requests (curl)

Create or continue ticket
```bash
curl -s -X POST http://localhost:8000/ticket \
  -H 'Content-Type: application/json' \
  -d '{"context":"acme","subject":"Password reset","message":"Hi"}'
```

Reply to ticket
```bash
curl -s -X POST http://localhost:8000/ticket/TICKET_ID/reply \
  -H 'Content-Type: application/json' \
  -d '{"message":"Follow-up"}'
```

Get ticket thread
```bash
curl -s http://localhost:8000/ticket/TICKET_ID
```

Stats
```bash
curl -s http://localhost:8000/stats
```

Admin list tickets
```bash
curl -s 'http://localhost:8000/admin/tickets?status=open'
```

Admin assign (with token)
```bash
curl -s -X POST 'http://localhost:8000/admin/ticket/TICKET_ID/assign?agent_name=alice' \
  -H 'X-Admin-Token: YOUR_TOKEN'
```

Admin close (with token)
```bash
curl -s -X POST 'http://localhost:8000/admin/ticket/TICKET_ID/close' \
  -H 'X-Admin-Token: YOUR_TOKEN'
```
