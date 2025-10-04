# Post-Release Analytics (Lite)

Features:
- **Page views** captured client-side → `/api/analytics` → NDJSON logs
- **Deploy annotations** on switch events
- **Dashboard** at `/analytics` with top pages and recent switches

Env hints (optional):
- `NEXT_PUBLIC_RELEASE_TAG` — e.g., v1.0.0
- `NEXT_PUBLIC_TRAFFIC_COLOR` — `blue` or `green` to stamp views

Data lives in `server/logs/analytics/`.
