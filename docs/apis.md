# API Reference

Base URL: `http://localhost:8000`

## Health
GET `/` → `{ message }`

## Tickets
POST `/ticket`
Request:
```json
{ "context": "acme", "subject": "Password reset", "message": "Hi" }
```
Response (AI reply or human assigned notice):
```json
{ "ticket_id": "...", "reply": "..." }
```

POST `/ticket/{ticket_id}/reply`
Request:
```json
{ "message": "Follow-up message" }
```
Response:
```json
{ "ticket_id": "...", "reply": "..." }
```

GET `/ticket/{ticket_id}` → full thread

## Stats
GET `/stats` → totals and sample summary

## Admin
GET `/admin/tickets?status=` → list tickets

POST `/admin/ticket/{ticket_id}/assign?agent_name=`
Headers (when `ADMIN_TOKEN` set): `X-Admin-Token: <token>`

POST `/admin/ticket/{ticket_id}/close`
Headers (when `ADMIN_TOKEN` set): `X-Admin-Token: <token>`

## OpenAPI
- Interactive docs: `/docs`
- Raw schema: `/openapi.json`
