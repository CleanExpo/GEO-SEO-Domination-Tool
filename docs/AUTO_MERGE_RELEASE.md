# Auto Merge Release (Staged)

This workflow:
1) Ensures a release branch (from `main`).
2) Opens PRs from your feature branches into the release branch and enables **auto-merge**.
3) Opens a final PR from release -> main and enables **auto-merge**.

> It relies on your existing CI + branch protections + **Merge Queue** to merge only when checks are green.

## How to run
1. Push all feature branches to origin.
2. Repository → **Actions** → **Auto Merge Release (Staged)** → **Run workflow**.
3. Accept defaults or edit the list of feature branches.
4. Click **Run workflow**.

GitHub will:
- Create/sync the release branch from main.
- Open PRs for each feature branch → release branch.
- Enable auto-merge on each PR (squash method).
- Add `release-queue` labels.
- Open a final PR: release → main with auto-merge enabled.
- Add `release-pr` label.

PRs will merge automatically as CI passes (via Merge Queue if enabled).

## Prerequisites
- **Branch protections** on `main` and release branches (see `RELEASE_GUARDRAILS.md`).
- **Merge Queue** enabled (see `MERGE_QUEUE.md`).
- Required status check: `build`.

## Notes
- If auto-merge fails (e.g., branch protections not allowing it), the PRs still open; you can enable auto-merge manually.
- The PR list includes all branches we used in this project; remove lines you don't need.
- Merge order is effectively serialized by the release branch and your Merge Queue.
