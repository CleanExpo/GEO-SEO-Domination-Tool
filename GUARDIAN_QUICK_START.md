# 🛡️ Guardian System - Quick Start Guide

**Access Dashboard**: [http://localhost:3000/guardian](http://localhost:3000/guardian)

---

## ⚡ 30-Second Start

```bash
# 1. Start the app
cd web-app
npm run dev

# 2. Open Guardian Dashboard
# Navigate to: http://localhost:3000/guardian

# 3. Click "Refresh Now" to see health status

# 4. Auto-fixes will show if any issues detected
```

---

## 🎯 What You'll See

### **Green = Good** ✅
- All MCP servers healthy
- System running smoothly
- No action needed

### **Yellow = Warning** ⚠️
- Performance degradation
- Slowness detected
- Monitor closely

### **Red = Critical** ❌
- MCP server down
- Configuration error
- **Auto-fix available** - Click to apply

---

## 🔧 Common Auto-Fixes

### **1. Docker MCP Not Working**
**Problem**: `Docker daemon not running`

**Auto-Fix**: Switches to npx (no Docker needed)

**Click**: "Auto-Fix Available" button in dashboard

**Result**: MCP works instantly

---

### **2. Missing Node Module**
**Problem**: `Module not found: 'package-name'`

**Auto-Fix**: Runs `npm install package-name`

**Duration**: ~30 seconds

**Result**: Module installed, build fixed

---

### **3. Connection Timeout**
**Problem**: `Connection timeout (>10s)`

**Auto-Fix**: Schedules retry with backoff

**Result**: Reconnects automatically

---

## 📊 Dashboard Sections

### **Top Metrics (4 Cards)**
1. **System Health**: Overall health %
2. **Critical Issues**: Count of problems
3. **Auto-Fix Available**: One-click solutions
4. **Recommendations**: Proactive suggestions

### **Critical Issues Alert (Red Banner)**
- Shows when servers are down
- Lists all critical problems
- Indicates if auto-fix available

### **Recommendations Panel (Blue Banner)**
- Enhancement suggestions
- Performance improvements
- Security updates

### **MCP Server Status Table**
- All MCP servers listed
- Real-time status indicators
- Response time metrics
- Error messages with context
- Auto-fix suggestions

### **System Layers Overview (3 Cards)**
- MCP Health Monitor status
- Auto-Fix Agent status
- Gap Detection status

---

## 🚀 API Quick Reference

### **Get Health Status**
```bash
curl http://localhost:3000/api/guardian/mcp-health
```

### **Trigger Health Check**
```bash
curl -X POST http://localhost:3000/api/guardian/mcp-health
```

### **View Available Fixes**
```bash
curl http://localhost:3000/api/guardian/auto-fix
```

### **Apply Auto-Fixes**
```bash
curl -X POST http://localhost:3000/api/guardian/auto-fix \
  -H "Content-Type: application/json" \
  -d '{"action": "apply"}'
```

### **Rollback a Fix**
```bash
curl -X POST http://localhost:3000/api/guardian/auto-fix \
  -H "Content-Type: application/json" \
  -d '{"action": "rollback", "fixId": "docker-to-npx-github"}'
```

---

## 📁 Where Things Are

### **Dashboard**
- UI: `web-app/app/guardian/page.tsx`
- Navigation: `web-app/components/Sidebar.tsx` (System section)

### **Services**
- Health Monitor: `web-app/services/guardian/mcp-health-monitor.ts`
- Auto-Fix Agent: `web-app/services/guardian/auto-fix-agent.ts`

### **APIs**
- Health: `web-app/app/api/guardian/mcp-health/route.ts`
- Auto-Fix: `web-app/app/api/guardian/auto-fix/route.ts`

### **Logs**
- Health: `server/logs/mcp-health/health-YYYY-MM-DD.ndjson`
- Auto-Fix: `server/logs/auto-fix/auto-fix-YYYY-MM-DD.ndjson`

### **Backups**
- Location: `server/backups/auto-fix/`
- Format: `{fixId}-{timestamp}/`

---

## 🔄 Auto-Refresh

**Default**: Every 5 minutes

**Toggle**: Use checkbox in dashboard header

**Manual Refresh**: Click "Refresh Now" button

---

## ⚙️ Configuration

### **Health Monitor Interval**

Default: 5 minutes

To change:
```typescript
// web-app/services/guardian/mcp-health-monitor.ts
await mcpHealthMonitor.startMonitoring(10); // 10 minutes
```

### **Auto-Fix Approval**

Default: Automated fixes run without approval

To require approval for all fixes:
```typescript
// In API call
{
  "action": "apply",
  "autoApprove": false  // Only run manual fixes
}
```

---

## 🎨 Status Indicators

### **Healthy** ✅
- Green check icon
- Response time < 1s
- No errors

### **Degraded** ⚠️
- Yellow alert icon
- Response time 1-3s
- Minor issues

### **Down** ❌
- Red X icon
- Connection failed
- Service unavailable

### **Misconfigured** 🔧
- Orange warning icon
- Config error
- Needs setup

---

## 🛠️ Troubleshooting

### **Dashboard Not Loading**
```bash
# Check if dev server running
cd web-app
npm run dev
```

### **Health Check Failing**
```bash
# Trigger manual check via API
curl -X POST http://localhost:3000/api/guardian/mcp-health
```

### **Auto-Fix Not Working**
```bash
# Check logs
cat server/logs/auto-fix/auto-fix-$(date +%Y-%m-%d).ndjson | tail -n 1 | jq
```

### **MCP Still Down After Fix**
```bash
# Rollback the fix
curl -X POST http://localhost:3000/api/guardian/auto-fix \
  -H "Content-Type: application/json" \
  -d '{"action": "rollback", "fixId": "YOUR_FIX_ID"}'
```

---

## 📈 Monitoring Best Practices

### **Daily**
1. Check dashboard for red alerts
2. Review critical issues
3. Apply auto-fixes if available

### **Weekly**
1. Review recommendations
2. Check MCP uptime percentages
3. Analyze health logs for patterns

### **Monthly**
1. Review all auto-fix history
2. Optimize health check intervals
3. Add new MCP servers to monitoring

---

## 🚀 Next Level Features (Coming Soon)

### **Gap Detection Agent**
- Finds missing MCPs based on project usage
- Suggests new tools for your workflow
- **Status**: Pending implementation

### **Enhancement Suggestion Agent**
- Analyzes code patterns
- Recommends optimizations
- Proactive security scanning
- **Status**: Pending implementation

### **Auto-Installation Agent**
- One-click install missing MCPs
- Zero-config tool setup
- **Status**: Pending implementation

---

## 💡 Pro Tips

1. **Enable Auto-Refresh**: Let the dashboard update automatically
2. **Bookmark `/guardian`**: Quick access to system health
3. **Check Logs**: NDJSON format is grep/jq friendly
4. **Test Rollback**: Verify backups work before relying on them
5. **Monitor Trends**: Track response times over days/weeks
6. **Act on Recommendations**: Blue banner suggestions prevent future issues

---

## 🎯 Key Takeaways

- **No more whack-a-mole**: System fixes itself
- **Real-time visibility**: Dashboard shows everything
- **One-click fixes**: Auto-fix handles common issues
- **Safe rollback**: Every fix is backed up
- **Proactive**: Suggestions prevent future problems

---

**Questions?** Check `GUARDIAN_SYSTEM_DEPLOYED.md` for full documentation.

**Issues?** Logs are in `server/logs/` (NDJSON format, queryable with jq).

---

**Your Guardian System is watching. 24/7. Always vigilant.** 🛡️
