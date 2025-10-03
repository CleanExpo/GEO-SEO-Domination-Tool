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
- `POST { action: 'introspect', id }` → returns per-step variables from builder manifests
- `POST { action: 'preview', id, overrides }` → returns per-file status+diff across all steps
- `POST { action: 'apply', id, selections, overrides }` → writes files honoring overrides

**UI** `/projects/blueprints`:
- Select blueprint → **introspect** (auto) → edit variables per step → **Preview** → review diffs → **Apply**

**Notes**:
- `${env:NAME}` placeholders in blueprint variables resolve from `process.env.NAME` at runtime.
- Writes restricted to allowlist: `web-app/`, `src/`, `database/`, `docs/`, `tools/`, `infra/`, `.github/`.

## Variable Overrides (Per Step)
Blueprints now surface variables for each step by **introspecting the builder manifests**. In `/projects/blueprints`, edit values before Preview. Overrides are sent as:

```json
{
  "action": "preview",
  "params": {
    "id": "basic-saas",
    "overrides": [
      { "index": 0, "variables": { "ROUTE_NAME": "custom-health" } },
      { "index": 1, "variables": { "SCHEMA_NAME": "custom_events" } }
    ]
  }
}
```

**Flow**:
1. User picks blueprint → UI calls `introspect` → gets variable schema for each step
2. UI seeds inputs with examples from builder manifests
3. User edits variables
4. **Preview** / **Apply** merge blueprint defaults with user overrides: `{ ...step.variables, ...overrides[index].variables }`
