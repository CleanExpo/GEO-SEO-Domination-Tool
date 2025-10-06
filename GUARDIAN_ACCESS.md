# 🛡️ Guardian Dashboard - Access Information

## 🚀 Current Session

**Server Status**: ✅ RUNNING

**URL**: [http://localhost:3005/guardian](http://localhost:3005/guardian)

**Port**: 3005 (Port 3000 was in use by another process)

---

## 📊 Available Endpoints

### **Guardian Dashboard (UI)**
```
http://localhost:3005/guardian
```

### **Health Monitor API**
```bash
# Get latest health status
curl http://localhost:3005/api/guardian/mcp-health

# Trigger manual health check
curl -X POST http://localhost:3005/api/guardian/mcp-health
```

### **Auto-Fix API**
```bash
# View available fixes
curl http://localhost:3005/api/guardian/auto-fix

# Apply automated fixes
curl -X POST http://localhost:3005/api/guardian/auto-fix \
  -H "Content-Type: application/json" \
  -d '{"action": "apply"}'

# Rollback a fix
curl -X POST http://localhost:3005/api/guardian/auto-fix \
  -H "Content-Type: application/json" \
  -d '{"action": "rollback", "fixId": "YOUR_FIX_ID"}'
```

---

## 🔄 Restart Server (if needed)

```bash
# Stop the background server
# (Server will auto-stop when Claude Code session ends)

# Start fresh
cd web-app
npm run dev
```

---

## 🎯 What You'll See

When you open the Guardian Dashboard, you'll see:

1. **System Health Metrics**
   - Overall health percentage
   - Critical issues count
   - Available auto-fixes
   - Recommendations

2. **Critical Issues Alert** (if any)
   - Red banner with details
   - Auto-fix suggestions

3. **Recommendations Panel** (if any)
   - Blue banner with enhancements
   - Proactive improvements

4. **MCP Server Status Table**
   - All 4 MCP servers listed
   - Status indicators (✅ healthy, ⚠️ degraded, ❌ down, 🔧 misconfigured)
   - Response times
   - Error details (if any)
   - Auto-fix availability

5. **Controls**
   - Auto-refresh toggle (5-minute intervals)
   - Manual refresh button

---

## 🐛 Troubleshooting

### **"Cannot GET /guardian" Error**

✅ **SOLVED**: Server is running on port 3005, not 3000

**Correct URL**: http://localhost:3005/guardian

### **Port Already in Use**

If you see this warning when starting the server:
```
⚠ Port 3000 is in use by process XXXXX, using available port 3005 instead.
```

This is **NORMAL**. Next.js automatically finds the next available port.

Just use the port shown in the startup message:
```
- Local:        http://localhost:3005
```

### **Dashboard Not Loading**

Check if server is running:
```bash
curl http://localhost:3005/api/guardian/mcp-health
```

If you get a response, the server is working. Try refreshing your browser.

---

## 📝 Notes

- Server automatically started in background
- Health monitoring begins immediately
- First health check runs on first API call
- Subsequent checks run every 5 minutes (if auto-refresh enabled)

---

**Your Guardian Dashboard is LIVE at**: [http://localhost:3005/guardian](http://localhost:3005/guardian)

🛡️ **The system is watching. 24/7. Always vigilant.**
