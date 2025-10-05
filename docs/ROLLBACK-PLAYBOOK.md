# Rollback Playbook

**Ticket:** DX-001
**Author:** Orchestra-Coordinator (Agent-Guide)
**Date:** 2025-10-05
**Status:** Comprehensive

## Quick Reference

| Scenario | MTTR Target | Rollback Command |
|----------|-------------|------------------|
| Vercel deployment broken | <3 min | GitHub Actions → Rollback Production |
| Database migration failed | <10 min | `psql $DATABASE_URL < migration_rollback.sql` |
| Multi-tenancy RLS broken | <5 min | Disable RLS + restore from snapshot |
| Secrets service down | <5 min | Set `SECRETS_FALLBACK=vercel_env` |
| GitHub integration broken | <5 min | Revert connector code + redeploy |

## Vercel Deployment Rollback

### When to Rollback

- Critical bug affecting 10%+ of users
- Performance degradation (p95 latency >2s)
- Security vulnerability introduced
- Build errors blocking production

### Automated Rollback (Recommended)

1. Navigate to: https://github.com/your-org/repo/actions/workflows/rollback.yml
2. Click "Run workflow"
3. Enter last known good deployment ID (find in Vercel dashboard)
4. Enter reason for rollback
5. Click "Run workflow" button
6. Wait 2-3 minutes for completion

### Manual Rollback

```bash
# Get last successful deployment ID
vercel ls --token=$VERCEL_TOKEN | grep "Ready" | head -1

# Rollback to specific deployment
vercel rollback <deployment-id> --token=$VERCEL_TOKEN --yes
```

### Verification

- Check https://your-domain.com/ returns 200 OK
- Test critical user flow (login → create company → run audit)
- Monitor error rate in Vercel logs (should drop to <0.1%)

## Database Migration Rollback

### PostgreSQL/Supabase (Production)

**Step 1: Create Database Snapshot (BEFORE rollback)**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

**Step 2: Execute Rollback**
```bash
# Multi-tenancy rollback (TENANT-001)
psql $DATABASE_URL <<EOF
BEGIN;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own organisation's companies" ON companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Owners can delete companies" ON companies;

-- Disable RLS
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;

-- Drop organisation_id columns
ALTER TABLE companies DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE audits DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE keywords DROP COLUMN IF EXISTS organisation_id;

-- Drop tables
DROP TABLE IF EXISTS organisation_members;
DROP TABLE IF EXISTS organisations;

COMMIT;
EOF
```

### RLS Rollback (Emergency)

If RLS breaks queries:

```sql
-- Disable RLS temporarily (use with caution!)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;

-- Re-enable after fix
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
```

**Estimated Rollback Time:** 5-10 minutes

## Secrets Management Rollback

### 1Password Connect Unavailable

```bash
# Fallback to Vercel environment variables
vercel env add SECRETS_FALLBACK
# Enter value: vercel_env

# Redeploy
vercel deploy --prod
```

### Encryption Key Compromised

1. Generate new encryption key: `openssl rand -hex 32`
2. Re-encrypt all secrets with new key
3. Update `SECRET_ENCRYPTION_KEY` in Vercel
4. Deploy new encryption helper

**Estimated Rollback Time:** 5 minutes

## GitHub Integration Rollback

### Rate Limiting Breaking Requests

```bash
# Revert GitHubConnectorV2
git revert <commit-hash>
git push origin main

# Redeploy
vercel deploy --prod
```

### Webhook Flooding

```bash
# Temporarily disable webhook endpoint
vercel env add WEBHOOKS_DISABLED
# Enter value: true

# Redeploy
vercel deploy --prod
```

**Estimated Rollback Time:** 3 minutes

## Application Code Rollback

### Git Revert Strategy

```bash
# Revert single commit
git revert <commit-hash>
git push origin main

# Revert multiple commits
git revert <oldest-commit>..<newest-commit>
git push origin main

# Force revert (use with caution)
git reset --hard <last-good-commit>
git push --force origin main  # WARNING: Destructive!
```

### Blue-Green Deployment Rollback

If using blue-green deployment:

```bash
# CLI rollback
geo bluegreen switch --target blue

# UI rollback
# Navigate to /deploy/bluegreen → Click "Rollback" button
```

## Infrastructure Rollback

### Vercel Configuration Rollback

```bash
# Revert vercel.json changes
git checkout HEAD~1 -- vercel.json
git commit -m "Revert: Rollback Vercel configuration"
git push origin main
```

### Environment Variables Rollback

```bash
# Remove problematic environment variable
vercel env rm VARIABLE_NAME --yes

# Restore previous value
vercel env add VARIABLE_NAME
# Enter previous value when prompted
```

## Post-Rollback Checklist

After executing any rollback, verify:

- [ ] Application loads without errors
- [ ] Test critical user workflows (login, create company, run audit)
- [ ] Check error logs (should return to baseline)
- [ ] Post incident report in Slack #incidents
- [ ] Schedule post-mortem meeting within 24 hours
- [ ] Update rollback playbook with lessons learnt
- [ ] Document root cause in incident report

## Rollback GitHub Actions Workflow

**File:** `.github/workflows/rollback.yml`

```yaml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      deployment_id:
        description: 'Deployment ID to rollback to (find in Vercel dashboard)'
        required: true
      reason:
        description: 'Reason for rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Validate Deployment ID
        run: |
          if [[ ! "${{ github.event.inputs.deployment_id }}" =~ ^dpl_[a-zA-Z0-9]+$ ]]; then
            echo "Invalid deployment ID format"
            exit 1
          fi

      - name: Rollback Vercel Deployment
        run: |
          vercel rollback ${{ github.event.inputs.deployment_id }} \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --yes
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Verify Rollback
        run: |
          # Wait 30s for deployment to stabilise
          sleep 30

          # Check health endpoint
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/health)
          if [ $STATUS -ne 200 ]; then
            echo "Health check failed with status $STATUS"
            exit 1
          fi

          echo "Rollback successful - health check returned 200"

      - name: Notify Team (Slack)
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🔄 Production Rollback Completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Rollback*\n*Deployment ID:* `${{ github.event.inputs.deployment_id }}`\n*Reason:* ${{ github.event.inputs.reason }}\n*Triggered by:* ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Rollback Scripts

### Database Migration Rollback Script

**File:** `scripts/rollback/tenant-001.sh`

```bash
#!/bin/bash
set -e

echo "Rolling back TENANT-001 multi-tenancy migration..."

# Verify we have database URL
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

# Create backup first
BACKUP_FILE="backup-before-rollback-$(date +%Y%m%d-%H%M%S).sql"
echo "Creating backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Execute rollback
echo "Executing rollback SQL..."
psql "$DATABASE_URL" <<EOF
BEGIN;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own organisation's companies" ON companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Owners can delete companies" ON companies;
DROP POLICY IF EXISTS "Users can view own organisation's audits" ON audits;
DROP POLICY IF EXISTS "Members can insert audits" ON audits;

-- Disable RLS
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;

-- Drop organisation_id columns
ALTER TABLE companies DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE audits DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE keywords DROP COLUMN IF EXISTS organisation_id;

-- Drop tables
DROP TABLE IF EXISTS organisation_members;
DROP TABLE IF EXISTS organisations;

COMMIT;
EOF

echo "Rollback complete. Backup saved to: $BACKUP_FILE"
```

## Incident Response Timeline

**0-5 minutes:**
- Identify issue severity
- Decide: rollback vs hotfix
- If rollback: trigger GitHub Actions workflow

**5-10 minutes:**
- Monitor rollback deployment
- Verify health checks pass
- Test critical user flows

**10-15 minutes:**
- Communicate to stakeholders
- Post incident report in Slack
- Begin root cause analysis

**Within 24 hours:**
- Schedule post-mortem meeting
- Document lessons learnt
- Update runbooks

## Escalation Contacts

| Role | Contact | When to Escalate |
|------|---------|------------------|
| Technical Lead | @tech-lead | Critical production outage |
| DevOps Engineer | @devops | Infrastructure failures |
| Product Owner | @product | Customer-facing impact |
| Security Team | @security | Security vulnerability |

## Testing Rollback Procedures

### Quarterly Rollback Drill

1. **Deploy intentionally broken code to staging**
2. **Execute rollback via GitHub Actions**
3. **Measure time to recovery (MTTR)**
4. **Document any improvements needed**

**Last Drill:** [Date]
**MTTR Achieved:** [Time]
**Next Drill:** [Date]

---

**Document Control:**
- **Version:** 2.0
- **Last Updated:** 2025-10-05
- **Author:** Orchestra-Coordinator (Agent-Guide)
- **Review Cycle:** Monthly
- **Next Review:** 2025-11-05
