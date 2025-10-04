# Blue/Green Deploy

This adds a reverse proxy (Nginx) in front of two app services (`web_blue`, `web_green`). You can build/bring up either and **switch traffic instantly** by rewriting the proxy config and reloading Nginx.

## Compose file
- `infra/docker/compose.bluegreen.yml`: defines `reverse_proxy`, `web_blue`, `web_green`.
- Reverse proxy listens on **host port 8080**.

## Proxy config
- Template: `infra/docker/nginx/conf.d/active.conf.tpl`
- Active: `infra/docker/nginx/conf.d/active.conf` → points to `geo_web_blue` or `geo_web_green`.

## CRM UI
- **/deploy/bluegreen**: buttons for **Build**, **Up**, **Switch**, **Rollback**, and **Status**.

## API
- `POST /api/bluegreen` with `{ action: 'status'|'build'|'up'|'switch'|'rollback'|'logs', target: 'blue'|'green' }`.

## Local tryout
```bash
# from repo root
docker compose -f infra/docker/compose.bluegreen.yml up -d --build reverse_proxy web_blue web_green
# Switch traffic (via API or manually by editing active.conf and reload)
```

> Tip: Use alongside your **Release Monitor** and **Merge Queue**; promote green only when checks pass.
