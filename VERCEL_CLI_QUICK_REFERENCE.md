# Vercel CLI Quick Reference

**Last Updated**: 2025-10-09

---

## 🚀 Quick Commands

```bash
# Monitor deployments
npm run vercel:monitor

# Watch mode (continuous)
npm run vercel:monitor:watch

# Check latest error
npm run vercel:errors

# Deployment status
npm run vercel:status

# Compare deployments
npm run vercel:status:compare

# Deploy to preview
npm run vercel:deploy

# Deploy to production
npm run vercel:deploy:prod

# Rollback to previous
npm run vercel:rollback

# Auto-monitor with reports
npm run vercel:auto-report
```

---

## 📊 Script Functions

### 1. **monitor-deployments.js**
**Purpose**: Real-time deployment monitoring
**Features**:
- Color-coded status (✓ Ready, ✗ Error, ⚠ Canceled)
- Watch mode for continuous monitoring
- Error detection and reporting
- Deployment statistics

**Usage**:
```bash
node scripts/vercel/monitor-deployments.js
node scripts/vercel/monitor-deployments.js --watch
node scripts/vercel/monitor-deployments.js --errors-only
```

---

### 2. **capture-errors.js**
**Purpose**: Extract and analyze build errors
**Features**:
- Parse webpack/TypeScript errors
- Generate fix recommendations
- Save detailed JSON reports
- Show import traces

**Usage**:
```bash
node scripts/vercel/capture-errors.js <deployment-url>
node scripts/vercel/capture-errors.js --latest
```

**Output Example**:
```
Module Not Found (2):
  1. @/components/ui/use-toast
     File: app/auth/signin/page.tsx

  2. cls-bluebird
     File: node_modules/request-promise/lib/rp.js

Recommendations:
  1. [HIGH] Install missing package
     Command: npm install cls-bluebird
```

---

### 3. **deployment-status.js**
**Purpose**: Quick deployment overview
**Features**:
- Summary statistics
- Recent deployment list
- Deployment comparison
- Git diff integration
- JSON output for CI/CD

**Usage**:
```bash
node scripts/vercel/deployment-status.js
node scripts/vercel/deployment-status.js --compare
node scripts/vercel/deployment-status.js --json
```

---

### 4. **auto-report.js**
**Purpose**: Background monitoring daemon
**Features**:
- Continuous monitoring every 5 minutes
- Markdown report generation
- Slack notifications
- State tracking (no duplicate reports)

**Usage**:
```bash
node scripts/vercel/auto-report.js
node scripts/vercel/auto-report.js --slack https://hooks.slack.com/...
node scripts/vercel/auto-report.js --interval 300
```

---

### 5. **deploy-manager.js**
**Purpose**: Safe deployment with pre-flight checks
**Features**:
- TypeScript compilation check
- ESLint validation
- Build test
- Rollback support
- Promotion to production

**Usage**:
```bash
node scripts/vercel/deploy-manager.js --deploy
node scripts/vercel/deploy-manager.js --deploy --prod
node scripts/vercel/deploy-manager.js --rollback
node scripts/vercel/deploy-manager.js --promote <url>
```

---

## 🎯 Common Workflows

### Workflow 1: Debug Failed Build
```bash
# 1. Check what failed
npm run vercel:monitor -- --errors-only

# 2. Get detailed error analysis
npm run vercel:errors

# 3. Review report
cat logs/vercel-errors/error-*.json
```

### Workflow 2: Safe Production Deployment
```bash
# 1. Deploy to preview with checks
npm run vercel:deploy

# 2. Compare with current production
npm run vercel:status:compare

# 3. Promote to production if good
node scripts/vercel/deploy-manager.js --promote <preview-url>
```

### Workflow 3: Emergency Rollback
```bash
# Quick rollback to previous production
npm run vercel:rollback
```

### Workflow 4: Continuous Monitoring
```bash
# Terminal 1: Watch deployments
npm run vercel:monitor:watch

# Terminal 2: Auto-reporter (optional)
npm run vercel:auto-report
```

---

## 📁 Output Locations

```
logs/
├── vercel-errors/              # JSON error reports
│   └── error-<id>-<timestamp>.json
├── vercel-reports/             # Markdown reports
│   └── report-<id>-<timestamp>.md
├── deployments/                # Deployment records
│   └── deployment-<timestamp>.json
└── .vercel-monitor-state.json  # Monitor state
```

---

## 🔧 Error Types & Fixes

### Module Not Found
```
Error: Can't resolve '@/components/ui/use-toast'
Fix: Check if file exists, verify tsconfig.json paths
Command: find . -name "use-toast*"
```

### Missing Dependency
```
Error: Can't resolve 'cls-bluebird'
Fix: Install missing npm package
Command: npm install cls-bluebird
```

### TypeScript Error
```
Error: Type error: Property 'foo' does not exist
Fix: Check types, run local type check
Command: npx tsc --noEmit
```

---

## 🚨 Pre-Flight Checks

When you run `npm run vercel:deploy`, these checks run automatically:

1. ✓ **TypeScript Compilation** (`tsc --noEmit`)
2. ✓ **ESLint** (`npm run lint`)
3. ✓ **Build Test** (`npm run build`)

If any **critical** check fails, deployment is aborted.

---

## 📊 Status Icons

- ✓ **Ready** (Green) - Deployment successful
- ✗ **Error** (Red) - Build failed
- ⚠ **Canceled** (Yellow) - Deployment canceled
- ⟳ **Building** (Blue) - In progress

---

## 🔔 Slack Notifications

Setup:
```bash
# Export webhook URL
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Run with notifications
node scripts/vercel/auto-report.js --slack $SLACK_WEBHOOK_URL
```

Notification includes:
- Deployment ID
- Status
- Error count
- Top 3 errors with file paths
- Direct link to deployment

---

## 🆘 Troubleshooting

**"Vercel command not found"**
```bash
npm install -g vercel
# or
npx vercel ls
```

**"No deployments found"**
```bash
vercel login
vercel link
```

**"Permission denied"**
```bash
chmod +x scripts/vercel/*.js
```

---

## 🎓 Tips & Best Practices

1. **Always run pre-flight checks before production**
   ```bash
   npm run vercel:deploy:prod
   ```

2. **Monitor in watch mode during active development**
   ```bash
   npm run vercel:monitor:watch
   ```

3. **Check errors immediately after failed build**
   ```bash
   npm run vercel:errors
   ```

4. **Keep auto-reporter running in background**
   ```bash
   npm run vercel:auto-report &
   ```

5. **Compare before promoting to production**
   ```bash
   npm run vercel:status:compare
   ```

---

## 📖 Full Documentation

See [scripts/vercel/README.md](scripts/vercel/README.md) for:
- Detailed API reference
- Advanced configuration
- CI/CD integration examples
- Custom notification setup
- Error type documentation

---

## 🔗 Related Commands

```bash
# Direct Vercel CLI commands
vercel ls --prod                    # List production deployments
vercel inspect <url> --logs         # Get deployment logs
vercel promote <url>                # Promote to production
vercel rollback                     # Rollback deployment

# Database commands
npm run db:test                     # Test database connection
npm run check:all                   # Check all services

# Gemini commands
npm run gemini:test                 # Test Gemini integration
npm run gemini:competitor           # Competitor analysis
```

---

**Need Help?** Check the logs in `logs/vercel-errors/` or run scripts with `--help` flag.
