# Security & Secrets Hardening

This repo now loads tokens from **env** first, then **`server/secrets/integrations.local.json`**.

## Sources (priority)
1) **Environment variables**
   - `GITHUB_TOKEN`, `VERCEL_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
2) **Local file** (gitignored): `server/secrets/integrations.local.json`

## CLI commands
```bash
# Set secrets (writes to gitignored file)
geo secrets --set github_token=ghp_xxx
geo secrets --set vercel_token=vercel_xxx
geo secrets --set supabase_url=https://xxx.supabase.co
geo secrets --set supabase_anonKey=eyJhbGci...

# Get raw value
geo secrets --get github_token

# List (redacted)
geo secrets --list
```

## In-app usage
- GitHub headers pull from `getGitHubToken()`.
- Supabase client reads from env, then file.

> Recommendation: In production, keep secrets in your platform's secret manager and expose only via env.
