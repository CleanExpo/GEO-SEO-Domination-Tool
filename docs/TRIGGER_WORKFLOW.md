# Auto Merge Release Workflow - Quick Reference

## Overview
The Auto Merge Release (Staged) workflow automates the merging of multiple feature branches into a release branch.

## Files Created

### 1. Trigger Script
**Location:** `C:\Users\Disaster Recovery 4\trigger-workflow.ps1`

**Purpose:** PowerShell script to trigger the GitHub Actions workflow from command line

### 2. GitHub Actions Workflow
**Location:** `.github/workflows/auto-merge-release-staged.yml`

**Purpose:** Automated workflow that merges feature branches into a release branch

## Usage

### Quick Start
```powershell
# Run with default repo (will prompt if not set)
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Disaster Recovery 4\trigger-workflow.ps1"

# Run with specific repo
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Disaster Recovery 4\trigger-workflow.ps1" -Repo "CleanExpo/GEO-SEO-Domination-Tool"
```

### Custom Parameters
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Disaster Recovery 4\trigger-workflow.ps1" `
  -Repo "CleanExpo/GEO-SEO-Domination-Tool" `
  -ReleaseBranch "release/v2.0" `
  -TargetBranch "develop"
```

## Default Branches to Merge
The script automatically merges these 18 feature branches:
- feature/build-system-fix
- feature/mcp-call-runner-fix
- feature/mcp-server-core
- feature/selective-apply-from-diff
- feature/rollback-from-backups
- feature/blueprint-saas-starter
- feature/autolink-after-apply
- feature/redis-workers-scale
- feature/supabase-auth-starter
- feature/role-guards-admin-ui
- feature/api-role-guards
- feature/oauth-providers
- feature/stripe-billing-starter
- feature/post-blueprint-autolink-deploy
- feature/deploy-runner
- feature/remote-ssh-deploy
- feature/release-guardrails
- feature/merge-queue

## Workflow Features

### What It Does
1. **Creates/Checks Out** release branch (default: `release/geo-mcp-v1`)
2. **Merges** feature branches one by one (no-fast-forward merges)
3. **Tracks** successful, failed, and skipped branches
4. **Pushes** the release branch to GitHub
5. **Creates** a Pull Request (optional) to merge into target branch
6. **Generates** detailed summary with merge results

### Handling Conflicts
- ✅ **Success:** Branch merges cleanly
- ❌ **Failed:** Merge conflict detected (requires manual resolution)
- ⏭️ **Skipped:** Branch doesn't exist in repository

## Monitoring

### View Workflow Runs
```powershell
cd geo-seo-domination-tool
gh run list --workflow="auto-merge-release-staged.yml"
```

### View Latest Run
```powershell
cd geo-seo-domination-tool
gh run view --web
```

### GitHub Web Interface
Navigate to: https://github.com/CleanExpo/GEO-SEO-Domination-Tool/actions

## Troubleshooting

### Script Issues

**Error:** "GitHub CLI (gh) not found"
```powershell
# Install GitHub CLI
winget install GitHub.cli
# or download from https://cli.github.com
```

**Error:** "Cannot view repository"
```powershell
# Authenticate with GitHub
gh auth login
```

### Workflow Issues

**Branch Not Found:** The workflow will skip branches that don't exist

**Merge Conflicts:** Failed merges will be listed in the workflow summary - resolve manually

**Permission Errors:** Ensure your GitHub token has `contents: write` and `pull-requests: write` permissions

## Advanced Usage

### Modify Branch List
Edit the trigger script to change which branches are merged:
```powershell
# Edit: C:\Users\Disaster Recovery 4\trigger-workflow.ps1
# Modify the $DefaultBranches variable
```

### Run Workflow Manually via GitHub
1. Go to Actions tab
2. Click "Auto Merge Release (Staged)"
3. Click "Run workflow"
4. Fill in the parameters
5. Click "Run workflow"

## Best Practices

1. **Review First:** Check which branches exist before running
2. **Test Locally:** Test merges locally if unsure about conflicts
3. **Monitor Progress:** Watch the GitHub Actions run for issues
4. **Review PR:** Review the auto-generated PR before merging to main
5. **Resolve Conflicts:** Handle merge conflicts promptly when flagged

## Output Example

When successful, you'll see:
```
✓ Created workflow_dispatch event for auto-merge-release-staged.yml at main
✓ Dispatched. Open GitHub → Actions → Auto Merge Release (Staged) to monitor.
```

## Support

For issues with:
- **Script:** Review PowerShell syntax and gh CLI installation
- **Workflow:** Check GitHub Actions logs and permissions
- **Branches:** Verify branch names and existence in repository
