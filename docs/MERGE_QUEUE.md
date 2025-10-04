# GitHub Merge Queue — Enablement Guide

This repo is queue-ready. **You must enable Merge Queue in branch protection** so GitHub creates merge groups that trigger `.github/workflows/merge-queue.yml`.

## 1) Turn on Merge Queue (UI)
1. Repository → **Settings → Branches → Branch protection rules**.
2. Edit **main** and **release/geo-mcp-v1** rules.
3. Check **Require status checks to pass before merging** and select required check: `build`.
4. Enable **Require merge queue** and choose a merge method (suggest **squash**).
5. Save.

> Notes
- Merge Queue requires branch protection. GitHub runs the **`merge_group`** event on a temporary test branch that includes your PR plus those ahead in queue. Our workflow listens to `merge_group` so CI runs on that combined branch. See GitHub docs.

## 2) (Optional) Lock via scripts
If you already used `scripts/protect-branches.(ps1|sh)` from **feature/release-guardrails**, re-run them and then toggle **Require merge queue** in UI (GitHub's API support for toggling this setting is limited).

## 3) Verify
- Open a PR → ensure `build` check appears.
- Click **Queue to merge** → a merge group is created; the `Merge Queue Checks` workflow runs on `merge_group`.
- When green, GitHub merges automatically.

## 4) Tips
- Keep a small set of required checks to speed the queue.
- Use the existing **Release PR Safety Checks** for PRs and **Merge Queue Checks** for merge groups.
