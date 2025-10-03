# Blueprints (MVP)

**What**: Multi-step presets that run several builders at once.

**Files**: JSON manifests under `/blueprints/*.json`:
```json
{
  "id": "basic-saas",
  "title": "Basic SaaS",
  "steps": [
    { "builder": "nextjs-api-route", "variables": { "ROUTE_NAME": "health" } },
    { "builder": "database-schema",  "variables": { "SCHEMA_NAME": "events" } }
  ]
}
```

**API** `/api/blueprints`:
- `GET` → list available blueprints
- `POST { action: 'list' }`
- `POST { action: 'preview', id }` → returns per-file status+diff across all steps
- `POST { action: 'apply', id, selections:[{to, action:'write'|'skip'}] }`

**UI** `/projects/blueprints`:
- Select blueprint → **Preview** → review diffs → **Apply**

**Notes**:
- `${env:NAME}` placeholders in blueprint variables resolve from `process.env.NAME` at runtime.
- Writes restricted to allowlist: `web-app/`, `src/`, `database/`, `docs/`, `tools/`, `infra/`, `.github/`.
