# Onboarding Checklist

1) **Bootstrap**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1
```
- Builds MCP & web
- Links `geo` CLI
- Runs `/api/health`

2) **Configure integrations** (CRM → /settings/integrations)
- GitHub token, Vercel token, Supabase URL + anon key

3) **Test builders**
- CRM → /projects/builds → *list → inspect → preview → apply*

4) **Run a blueprint**
- CRM → /projects/catalog → *SaaS Starter* (optional Auto-Link + First Deploy)

5) **Monitor release**
- CRM → /release/monitor → enter owner/repo → **Refresh**

6) **Health**
- CRM → /health or `geo doctor`
