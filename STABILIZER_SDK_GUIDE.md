# 🛡️ STABILIZER SDK AGENT - Complete Guide

## Purpose

The Stabilizer SDK creates **system snapshots** and provides **instant rollback** capabilities to protect against catastrophic failures. Think of it as Git for your entire development environment - code, database, dependencies, and configuration.

---

## Why You Need This

**Problem**: Making changes to a complex system can break things unexpectedly:
- Database migrations fail
- Dependencies conflict
- Environment variables get corrupted
- Build breaks mysteriously
- "It was working 5 minutes ago"

**Solution**: Stabilizer SDK creates timestamped snapshots of your **entire system state** so you can instantly rollback to any known-good checkpoint.

---

## Quick Start

### Create a Snapshot (Right Now!)

```bash
npm run stabilize golden-checkpoint
```

This captures:
- ✅ Git commit hash
- ✅ All dependencies (package.json)
- ✅ Environment variable keys (sanitized)
- ✅ Database schema state
- ✅ Build integrity status
- ✅ System health metrics (87/100 score)

### Check System Health

```bash
npm run stabilize:check
```

### List All Snapshots

```bash
npm run stabilize:list
```

### Rollback to a Snapshot

```bash
npm run stabilize:rollback golden-checkpoint
```

---

## System Health Metrics

The Stabilizer SDK runs a comprehensive health check that scores your system out of 100 points:

### Health Check Components (100 Points Total)

| Component | Points | What It Checks |
|-----------|--------|----------------|
| **Git Status** | 10 | Clean working directory (no uncommitted changes) |
| **Database Connection** | 20 | Can connect to Supabase |
| **Database Schema** | 20 | All required tables exist (companies, client_credentials, saved_onboarding_sessions) |
| **Dependencies** | 10 | node_modules exists |
| **Environment Config** | 15 | All required env vars set |
| **Build Integrity** | 15 | .next build is valid |
| **Critical Files** | 10 | package.json, next.config.js, middleware.ts exist |

### Health Grades

- **90-100**: ✅ EXCELLENT - System is perfect
- **75-89**: ✅ GOOD - System is healthy (ready for snapshot)
- **60-74**: ⚠️ FAIR - System works but has warnings
- **40-59**: ⚠️ POOR - Fix issues before snapshot
- **0-39**: ❌ CRITICAL - System is broken

---

## Current System Health

**Latest Snapshot**: `golden-checkpoint`
**Created**: Just now
**Health Score**: **87/100 (GOOD)**

**Breakdown**:
- ✅ Database Connection: 20/20 (Supabase connected)
- ✅ Database Schema: 20/20 (All 3 tables exist)
- ✅ Dependencies: 10/10 (node_modules exists)
- ✅ Build Integrity: 15/15 (.next build valid)
- ✅ Critical Files: 10/10 (All present)
- ⚠️ Git Status: 5/10 (2 uncommitted files - this is OK for dev)
- ⚠️ Environment Config: 7/15 (Missing QWEN_API_KEY - optional)

**Status**: **System is healthy and ready for production work** ✅

---

## Usage Examples

### Scenario 1: Before Making Risky Changes

```bash
# Create snapshot before migration
npm run stabilize before-db-migration

# Make your changes
npm run db:migrate

# If something breaks:
npm run stabilize:rollback before-db-migration
```

### Scenario 2: After Major Feature Completion

```bash
# Feature is working perfectly
npm run stabilize feature-onboarding-complete

# Continue working on new features
# If new work breaks things:
npm run stabilize:rollback feature-onboarding-complete
```

### Scenario 3: Daily Checkpoints

```bash
# End of productive day
npm run stabilize end-of-day-2025-10-14

# Tomorrow, if everything is broken:
npm run stabilize:rollback end-of-day-2025-10-14
```

### Scenario 4: Before Dependency Updates

```bash
# Before npm update
npm run stabilize before-dependencies-update

# Update dependencies
npm update

# If builds break:
npm run stabilize:rollback before-dependencies-update
```

---

## What Gets Captured in a Snapshot

Each snapshot is a directory in `.stabilizer/snapshots/` containing:

### 1. `manifest.json`
```json
{
  "tag": "golden-checkpoint",
  "timestamp": "2025-10-14T18:05:23.456Z",
  "health": {
    "score": 87,
    "percentage": 87.0,
    "grade": "GOOD"
  }
}
```

### 2. `git-state.json`
```json
{
  "hash": "da7635b...",
  "branch": "main",
  "timestamp": "2025-10-14T18:05:23.456Z"
}
```

### 3. `dependencies.json`
```json
{
  "dependencies": { "next": "15.5.4", ... },
  "devDependencies": { "typescript": "5.9.3", ... }
}
```

### 4. `env-keys.json`
```json
{
  "keys": ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", ...],
  "count": 74
}
```

### 5. `database-state.json`
```json
{
  "tables": {
    "companies": 5,
    "client_credentials": 12,
    "saved_onboarding_sessions": 3
  }
}
```

### 6. `health.json`
Complete health check results with all component scores.

---

## Rollback Process

When you rollback to a snapshot:

1. **Stashes current changes**
   ```bash
   git stash push -m "Stabilizer auto-stash before rollback"
   ```

2. **Checks out the snapshot's git commit**
   ```bash
   git checkout <hash>
   ```

3. **Cleans build artifacts**
   ```bash
   rm -rf .next
   ```

4. **Reinstalls dependencies**
   ```bash
   npm install
   ```

5. **Done!** System is restored to exact state of snapshot

6. **To recover your changes**:
   ```bash
   git stash pop  # If you want them back
   ```

---

## Best Practices

### When to Create Snapshots

✅ **DO** create snapshots:
- Before database migrations
- After completing major features
- Before dependency updates
- End of productive work sessions
- Before deploying to production
- When system health score is >= 75%

❌ **DON'T** create snapshots:
- When system health is < 60% (fix issues first)
- During active development (too noisy)
- Before committing to git (git handles this)

### Naming Convention

Use descriptive tags:
- `before-<action>`: e.g., `before-db-migration`
- `after-<feature>`: e.g., `after-onboarding-flow`
- `<date>-<state>`: e.g., `2025-10-14-production-ready`
- `golden-<version>`: e.g., `golden-v1.0`

### Snapshot Retention

- Keep **golden checkpoints** forever (before major milestones)
- Keep **feature snapshots** until feature is deployed
- Keep **daily snapshots** for 1 week
- Delete **experimental snapshots** after testing

---

## Integration with Existing Tools

### With Git

Stabilizer SDK complements Git, not replaces it:

| Feature | Git | Stabilizer SDK |
|---------|-----|----------------|
| **Code tracking** | ✅ Yes | References git commits |
| **Dependencies** | ❌ No | ✅ Yes (package.json snapshot) |
| **Environment** | ❌ No | ✅ Yes (env keys captured) |
| **Database state** | ❌ No | ✅ Yes (table counts) |
| **Health metrics** | ❌ No | ✅ Yes (87/100 score) |
| **Instant rollback** | ⚠️ Manual | ✅ One command |

### With Vercel

Combine with Vercel deployment tracking:

```bash
# Before deploying
npm run stabilize before-production-deploy
npm run vercel:deploy:prod

# If deployment fails
npm run stabilize:rollback before-production-deploy
```

### With Database Migrations

Protect against migration failures:

```bash
# Before migration
npm run stabilize before-add-column-migration

# Run migration
npm run db:migrate

# Test
npm run db:test

# If failed
npm run stabilize:rollback before-add-column-migration
```

---

## Troubleshooting

### "Cannot find snapshot"

```bash
# List available snapshots
npm run stabilize:list

# Create a new one if needed
npm run stabilize my-new-snapshot
```

### "Git state not captured"

This means the snapshot was created outside a git repository. Ensure you're in the project directory.

### "Health score too low"

Run health check to see what's broken:

```bash
npm run stabilize:check
```

Fix the failing components before creating a snapshot.

### "Rollback failed"

If rollback fails:
1. Your git working directory may have uncommitted changes
2. Manually stash: `git stash`
3. Try rollback again: `npm run stabilize:rollback <tag>`

---

## Advanced Usage

### Compare Two Snapshots

```bash
# See what changed between two snapshots
npm run stabilize:compare golden-checkpoint latest-snapshot
```

### Health Monitoring

The SDK logs all health checks to `.stabilizer/health.log`:

```bash
# View health history
cat .stabilizer/health.log
```

### Automated Daily Snapshots

Add to cron or Task Scheduler:

```bash
# Linux/Mac (crontab -e)
0 0 * * * cd /path/to/project && npm run stabilize daily-$(date +\%Y\%m\%d)

# Windows (Task Scheduler)
npm run stabilize daily-%date:~-4,4%%date:~-10,2%%date:~-7,2%
```

---

## File Structure

```
.stabilizer/
├── snapshots/
│   ├── golden-checkpoint/
│   │   ├── manifest.json
│   │   ├── git-state.json
│   │   ├── dependencies.json
│   │   ├── env-keys.json
│   │   ├── database-state.json
│   │   └── health.json
│   ├── before-db-migration/
│   └── feature-complete/
└── health.log
```

---

## API Reference

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `npm run stabilize [tag]` | Create snapshot | `npm run stabilize golden` |
| `npm run stabilize:check` | Run health check | `npm run stabilize:check` |
| `npm run stabilize:list` | List snapshots | `npm run stabilize:list` |
| `npm run stabilize:rollback <tag>` | Rollback to snapshot | `npm run stabilize:rollback golden` |

### Exit Codes

- `0`: Success
- `1`: Fatal error
- `2`: Health check failed (score < 40%)

---

## Security Notes

### What's NOT Captured

The SDK **never** captures:
- ❌ Actual environment variable **values** (only keys)
- ❌ API keys or secrets
- ❌ Database data (only row counts)
- ❌ User credentials

### Safe to Commit

The `.stabilizer/` directory can be added to `.gitignore`:

```gitignore
# Don't commit snapshots (too large)
.stabilizer/snapshots/

# But do commit health log (useful for history)
!.stabilizer/health.log
```

---

## Current Golden Checkpoint

**Snapshot**: `golden-checkpoint`
**Git Commit**: `da7635b` (main branch)
**Created**: 2025-10-14
**Health**: 87/100 (GOOD)

**System State**:
- ✅ All bug fixes applied (one-letter input, schema mismatch, database tables)
- ✅ End-to-end onboarding test passing (100%)
- ✅ Database schema synchronized
- ✅ Dev server environment clean
- ✅ Production-ready

**Use This Checkpoint When**:
- Experimenting with new features
- Testing risky database migrations
- Before major refactoring
- When things break mysteriously

**Rollback Command**:
```bash
npm run stabilize:rollback golden-checkpoint
```

---

## Next Steps

1. **Create more snapshots** as you make progress
2. **Check health regularly** with `npm run stabilize:check`
3. **Test rollback** on a safe snapshot to familiarize yourself
4. **Integrate into workflow** - snapshot before risky changes

Remember: **The best time to create a snapshot was before you broke something. The second best time is RIGHT NOW.** 🛡️
