# Vercel Compatibility Map

| Vercel | GEO Equivalent |
|---|---|
| `vercel init` | `geo init --id saas-starter` |
| `vercel link` | `geo link --owner --repo --vercel` |
| `vercel env` | `geo env --set KEY=VALUE` |
| `vercel deploy` | `/projects/builds` + `/api/deploy` + `geo deploy up -d` |
| `vercel logs` | `geo logs --service web` |
| `vercel --prod` | merge to `main` via Merge Queue, then deploy |
