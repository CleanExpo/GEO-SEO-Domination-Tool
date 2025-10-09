# Vercel CLI Scripts

Comprehensive suite of scripts for monitoring, managing, and debugging Vercel deployments.

---

## 📦 Scripts Overview

| Script | Purpose | Key Features |
|--------|---------|-------------|
| `monitor-deployments.js` | Monitor deployment status | Watch mode, error detection, color-coded output |
| `capture-errors.js` | Analyze build errors | Parse webpack errors, generate recommendations |
| `deployment-status.js` | Quick status check | Compare deployments, git diff integration |
| `auto-report.js` | Automated monitoring | Background daemon, Slack notifications |
| `deploy-manager.js` | Deployment management | Pre-flight checks, rollback, promote |

---

## 🚀 Quick Start

### 1. Monitor Deployments

```bash
# Check current deployment status
node scripts/vercel/monitor-deployments.js

# Watch mode (continuous monitoring)
node scripts/vercel/monitor-deployments.js --watch

# Show only errors
node scripts/vercel/monitor-deployments.js --errors-only
```

**Output**:
```
═══════════════════════════════════════
  Vercel Deployment Monitor
═══════════════════════════════════════

Production Deployments (10):

1. ✓ Ready      3h      2m      ovbp4abfx
2. ✓ Ready      3h      2m      pwq1vax8d
3. ⚠ Canceled   3h      3m      dv8264wnw
4. ✗ Error      18h     32s     nlzw91mgo

Summary:
  Total deployments: 10
  Successful: 8
  Failed: 2
  Error reports saved: 2
```

---

### 2. Capture Build Errors

```bash
# Analyze specific deployment
node scripts/vercel/capture-errors.js https://geo-seo-domination-tool-xxx.vercel.app

# Analyze latest failed deployment
node scripts/vercel/capture-errors.js --latest
```

**Output**:
```
════════════════════════════════════════════════════════════
  Build Error Report
════════════════════════════════════════════════════════════

Deployment: https://geo-seo-domination-tool-nlzw91mgo-unite-group.vercel.app
Analyzed: 2025-10-09T12:00:00.000Z
Total Errors: 2

Build Environment:
  nextVersion: 15.5.4
  buildLocation: Washington, D.C., USA (East)
  cores: 4
  memory: 8 GB
  commit: 0e84ee9
  branch: main

Module Not Found (2):

  1. @/components/ui/use-toast
     File: app/auth/signin/page.tsx
     Import chain:
       → ./app/auth/signin/page.tsx

  2. cls-bluebird
     File: node_modules/request-promise/lib/rp.js
     Import chain:
       → ./node_modules/snoowrap/dist/request_handler.js
       → ./services/api/reddit.ts
       → ./app/api/content-opportunities/discover/route.ts

Recommendations:

  1. [HIGH] Missing npm package: cls-bluebird
     Fix: Install the missing package
     Command: npm install cls-bluebird

  2. [HIGH] Path alias import not resolved: @/components/ui/use-toast
     Fix: Check if the file exists at the aliased path. Verify tsconfig.json paths configuration.
     Command: find . -name "use-toast"

════════════════════════════════════════════════════════════

✓ Report saved: error-report-nlzw91mgo-2025-10-09T12-00-00.json
```

---

### 3. Check Deployment Status

```bash
# Quick status check
node scripts/vercel/deployment-status.js

# Compare latest with previous
node scripts/vercel/deployment-status.js --compare

# JSON output (for CI/CD)
node scripts/vercel/deployment-status.js --json
```

---

### 4. Automated Monitoring

```bash
# Start background monitor
node scripts/vercel/auto-report.js

# With Slack notifications
node scripts/vercel/auto-report.js --slack https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Custom check interval (in seconds)
node scripts/vercel/auto-report.js --interval 300
```

**Features**:
- Checks every 5 minutes (configurable)
- Generates Markdown reports
- Sends Slack notifications
- Tracks reported deployments to avoid duplicates

---

### 5. Deployment Management

```bash
# Deploy to preview (with pre-flight checks)
node scripts/vercel/deploy-manager.js --deploy

# Deploy to production
node scripts/vercel/deploy-manager.js --deploy --prod

# Rollback to previous production
node scripts/vercel/deploy-manager.js --rollback

# Promote preview to production
node scripts/vercel/deploy-manager.js --promote https://geo-seo-domination-tool-xxx.vercel.app
```

**Pre-flight Checks**:
1. TypeScript compilation (`tsc --noEmit`)
2. ESLint (`npm run lint`)
3. Build test (`npm run build`)

---

## 📁 File Structure

```
scripts/vercel/
├── README.md                    # This file
├── monitor-deployments.js       # Deployment monitor
├── capture-errors.js            # Error analyzer
├── deployment-status.js         # Status checker
├── auto-report.js               # Automated reporter
└── deploy-manager.js            # Deployment manager

logs/
├── vercel-errors/              # Error reports (JSON)
│   └── error-<id>-<timestamp>.json
├── vercel-reports/             # Markdown reports
│   └── report-<id>-<timestamp>.md
└── deployments/                # Deployment records
    └── deployment-<timestamp>.json
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Set custom check interval (seconds)
export VERCEL_CHECK_INTERVAL=300

# Slack webhook for notifications
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Config Files

Edit `CONFIG` object in each script:

```javascript
const CONFIG = {
  project: 'geo-seo-domination-tool',
  team: 'unite-group',
  checkInterval: 60000,          // 1 minute
  errorLogDir: './logs/vercel-errors',
  maxDeployments: 20,
};
```

---

## 🎯 Use Cases

### Case 1: Debug Failed Deployment

```bash
# 1. Find latest error
node scripts/vercel/monitor-deployments.js --errors-only

# 2. Capture detailed errors
node scripts/vercel/capture-errors.js --latest

# 3. Review generated report
cat logs/vercel-errors/error-*.json
```

### Case 2: Pre-Production Deployment

```bash
# 1. Deploy to preview with checks
node scripts/vercel/deploy-manager.js --deploy

# 2. Verify deployment
node scripts/vercel/deployment-status.js --compare

# 3. Promote to production if successful
node scripts/vercel/deploy-manager.js --promote <preview-url>
```

### Case 3: Continuous Monitoring

```bash
# Terminal 1: Run auto-reporter
node scripts/vercel/auto-report.js --slack $SLACK_WEBHOOK_URL

# Terminal 2: Watch deployments
node scripts/vercel/monitor-deployments.js --watch
```

### Case 4: Emergency Rollback

```bash
# Quick rollback to previous production
node scripts/vercel/deploy-manager.js --rollback
```

---

## 📊 Error Types Detected

### 1. Module Not Found
- Missing npm packages
- Incorrect import paths
- Path alias issues

### 2. TypeScript Errors
- Type mismatches
- Missing type definitions
- Interface violations

### 3. Syntax Errors
- Invalid JavaScript/TypeScript syntax
- Missing brackets/quotes
- Parse errors

### 4. Build Errors
- Webpack compilation failures
- Next.js build errors
- Environment issues

---

## 🔔 Notification Examples

### Slack Notification Format

```json
{
  "text": "🚨 Vercel Deployment Failed",
  "blocks": [
    {
      "type": "header",
      "text": "🚨 Vercel Deployment Failed"
    },
    {
      "type": "section",
      "fields": [
        { "text": "*Deployment:*\nnlzw91mgo" },
        { "text": "*Status:*\nError" },
        { "text": "*Errors:*\n2" }
      ]
    },
    {
      "type": "section",
      "text": "*Errors:*\n• Module Not Found: `@/components/ui/use-toast`\n• Module Not Found: `cls-bluebird`"
    }
  ]
}
```

---

## 🛠️ NPM Scripts Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "vercel:monitor": "node scripts/vercel/monitor-deployments.js",
    "vercel:errors": "node scripts/vercel/capture-errors.js --latest",
    "vercel:status": "node scripts/vercel/deployment-status.js",
    "vercel:deploy": "node scripts/vercel/deploy-manager.js --deploy",
    "vercel:deploy:prod": "node scripts/vercel/deploy-manager.js --deploy --prod",
    "vercel:rollback": "node scripts/vercel/deploy-manager.js --rollback"
  }
}
```

Usage:
```bash
npm run vercel:monitor
npm run vercel:errors
npm run vercel:deploy
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm install

      - name: Deploy with pre-flight checks
        run: node scripts/vercel/deploy-manager.js --deploy --prod
        env:
          CI: true
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Monitor deployment
        run: node scripts/vercel/monitor-deployments.js --errors-only
```

---

## 📖 API Reference

### monitor-deployments.js

```javascript
const { getDeployments, checkDeployment } = require('./monitor-deployments');

// Get recent deployments
const deployments = await getDeployments('production');

// Check specific deployment
const result = await checkDeployment(deployments[0]);
```

### capture-errors.js

```javascript
const { parseBuildErrors, generateErrorReport } = require('./capture-errors');

// Parse logs
const errors = parseBuildErrors(logs);

// Generate report
const report = generateErrorReport(url, logs, errors);
```

### deployment-status.js

```javascript
const { getCurrentDeployment } = require('./deployment-status');

// Get current production deployment
const current = await getCurrentDeployment();
console.log(current.url, current.commit);
```

---

## 🐛 Troubleshooting

### Issue: "Vercel command not found"

```bash
# Install Vercel CLI globally
npm install -g vercel

# Or use npx
npx vercel ls
```

### Issue: "Permission denied"

```bash
# Make scripts executable
chmod +x scripts/vercel/*.js

# Or use node directly
node scripts/vercel/monitor-deployments.js
```

### Issue: "No deployments found"

```bash
# Login to Vercel
vercel login

# Link project
vercel link
```

---

## 📝 Best Practices

1. **Run pre-flight checks before production deployment**
   ```bash
   node scripts/vercel/deploy-manager.js --deploy --prod
   ```

2. **Monitor deployments in watch mode during active development**
   ```bash
   node scripts/vercel/monitor-deployments.js --watch
   ```

3. **Set up automated monitoring with Slack notifications**
   ```bash
   node scripts/vercel/auto-report.js --slack $WEBHOOK_URL &
   ```

4. **Always review error reports before fixing**
   ```bash
   node scripts/vercel/capture-errors.js --latest
   ```

5. **Keep deployment logs for debugging**
   - Logs saved in `logs/vercel-errors/`
   - Reports saved in `logs/vercel-reports/`

---

## 🚦 Exit Codes

- `0` - Success
- `1` - General error
- `2` - Pre-flight check failure
- `3` - Deployment failure
- `4` - Rollback failure

---

## 📄 License

MIT License - Part of GEO-SEO Domination Tool

---

## 🤝 Contributing

1. Add new error detection patterns in `capture-errors.js`
2. Improve recommendation logic in `generateRecommendations()`
3. Add new notification channels in `auto-report.js`
4. Enhance pre-flight checks in `deploy-manager.js`

---

## 📞 Support

For issues or questions:
1. Check logs in `logs/vercel-errors/`
2. Run with `--verbose` flag (if available)
3. Review error reports in Markdown format

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
**Maintained By**: GEO-SEO Development Team
