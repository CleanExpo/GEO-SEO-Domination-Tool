# SEO Pro Pack

Three builders + one blueprint to create an SEO toolkit quickly.

## Builders
1. **seo-sitemap-crawler**
   - Vars: `START_URL`, `MAX_URLS` (default 1000), `OUTPUT_DIR` (default `server/logs/seo`)
   - Output: `crawl-*.json` with URL inventory
   - Run: `node server/logs/seo/crawl-site.ts`

2. **seo-site-audit-lite**
   - Vars: `INPUT_JSON` (from crawler), `OUTPUT_DIR` (default `server/logs/seo`), `CONCURRENCY` (default 6)
   - Output: `audit-*.json`, `audit-*.csv`
   - Run: `node server/logs/seo/audit-site.ts`

3. **seo-keyword-cluster-lite**
   - Vars: `INPUT_CSV` (must contain `keyword` column), `OUTPUT_DIR`
   - Output: `clusters-*.csv`
   - Run: `node server/logs/seo/cluster-keywords.ts`

## Blueprint: `seo-app-in-a-box`
- Chains the three builders; add Docker/CI wiring automatically.
- In CRM: **/projects/catalog** → run the blueprint (edit START_URL before applying).
- In CLI: `geo blueprint --run seo-app-in-a-box` (or `geo init` after editing steps).

> Note: These are **lite, dependency-free** scripts (no cheerio/embeddings). You can upgrade to heavy-duty parsing/LLM clustering later.
