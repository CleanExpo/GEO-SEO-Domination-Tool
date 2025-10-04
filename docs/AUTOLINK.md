# Auto-Link (GitHub → Vercel)

**What this adds**
- `POST /api/autolink` ⇒ orchestrates `github_create_repo` then `vercel_create_project` using your existing `/api/link` route and saved tokens.
- **UI** at `/projects/autolink`: fill owner/repo, optional Vercel project name, then click **Create Repo + Link Vercel**.
- Counts as `api_call` under quotas and respects your role-based caps.

**Requirements**
- Save tokens first at **/settings/integrations** (GitHub + Vercel).

**Tip**
- Run a blueprint (e.g., **SaaS Starter**) first, then use Auto-Link to deploy quickly.
