# Release Monitor

**URL:** `/release/monitor`

Enter `owner` and `repo`, then click **Refresh** to view:
- Open PRs targeting your **release** branch and **main**
- Status contexts (required checks) and check runs (merge queue CI)
- Mergeability state, labels, links

**Setup:**
- Ensure a GitHub token is saved in **/settings/integrations** or set `GITHUB_TOKEN` env.
- Branch names default to `main` and `release/geo-mcp-v1`, but you can change them in the UI.
