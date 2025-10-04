# Uptime Checker (Lite)

Zero-dependency uptime monitoring with NDJSON logging, API, and UI badge.

## Overview

- **Ping target**: `<proxy>/api/health` (default `http://localhost:8080`)
- **Logs to**: `server/logs/uptime/pings.ndjson`
- **API**: `/api/uptime` returns 24h availability and last 200 samples
- **Badge**: Appears on **/health** page

## Features

✅ **No dependencies** - Pure PowerShell + Node.js fs
✅ **NDJSON logging** - One ping per line, easy to parse
✅ **24h availability** - Calculated from recent pings
✅ **Color-coded badge** - Green (≥99.9%), Yellow (≥98%), Red (<98%)
✅ **Scheduler-ready** - Works with Windows Task Scheduler or cron

## Run Manually

```powershell
# Ping default target (http://localhost:8080/api/health)
pwsh scripts/uptime/ping.ps1

# Ping custom target
pwsh scripts/uptime/ping.ps1 -BaseUrl http://localhost:3000

# With custom timeout
pwsh scripts/uptime/ping.ps1 -BaseUrl http://localhost:8080 -TimeoutMs 10000
```

**Output:**
- **Success**: `✓ UP in 45 ms (HTTP 200)` (green) - exits 0
- **Failure**: `✗ DOWN in 5002 ms (timeout)` (red) - exits 1

## Schedule (Windows Task Scheduler)

### Create Scheduled Task

1. Open Task Scheduler → Create Task
2. **General** tab:
   - Name: `GEO-SEO Uptime Ping`
   - Run whether user is logged on or not
3. **Triggers** tab:
   - New → Repeat task every **5 minutes** indefinitely
4. **Actions** tab:
   - Program: `powershell.exe`
   - Arguments:
     ```
     -NoProfile -ExecutionPolicy Bypass -File "D:\GEO_SEO_Domination-Tool\scripts\uptime\ping.ps1" -BaseUrl http://localhost:8080
     ```
5. **Conditions** tab:
   - Uncheck "Start only if on AC power"
6. **Settings** tab:
   - Allow task to be run on demand
   - If task fails, restart every 1 minute

### PowerShell Alternative

```powershell
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -File "D:\GEO_SEO_Domination-Tool\scripts\uptime\ping.ps1" -BaseUrl http://localhost:8080'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "GEO-SEO Uptime Ping" -Action $action -Trigger $trigger -Principal $principal -Settings $settings
```

## API Endpoints

### POST /api/uptime

Record a ping result.

**Request Body:**
```json
{
  "ok": true,
  "ms": 45,
  "code": 200,
  "err": ""
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /api/uptime

Get 24h availability stats.

**Response:**
```json
{
  "ok": true,
  "availability24h": 99.87,
  "samples": [
    {"ts": "2025-10-04T10:00:00Z", "ok": true, "ms": 45, "code": 200, "err": ""},
    {"ts": "2025-10-04T10:05:00Z", "ok": true, "ms": 38, "code": 200, "err": ""}
  ]
}
```

## Log Format

**File**: `server/logs/uptime/pings.ndjson`

**Format**: Newline-delimited JSON (NDJSON)

```json
{"ts":"2025-10-04T10:00:00.123Z","ok":true,"ms":45,"code":200,"err":""}
{"ts":"2025-10-04T10:05:00.456Z","ok":false,"ms":5002,"code":null,"err":"timeout"}
```

**Fields:**
- `ts` - ISO 8601 timestamp
- `ok` - Boolean (ping succeeded)
- `ms` - Response time in milliseconds
- `code` - HTTP status code (or null)
- `err` - Error message (empty if ok)

## UI Badge

The badge appears on `/health` page with:
- **Color**: Green (≥99.9%), Yellow (≥98%), Red (<98%), Gray (no data)
- **Text**: "Uptime (24h): XX.XX%"
- **Auto-refresh**: Loads on page visit

## Configuration

### Change CRM API Port

If your CRM runs on a different port, edit `scripts/uptime/ping.ps1`:

```powershell
# Line 9
$uri = 'http://localhost:3004/api/uptime'  # Change port here
```

### Change Target Endpoint

The ping script checks `/api/health` by default. To ping a different endpoint:

```powershell
pwsh scripts/uptime/ping.ps1 -BaseUrl http://localhost:8080/api/custom-health
```

## Monitoring & Alerts

### Email Alerts on Failure

Add to scheduled task or wrap ping script:

```powershell
# Check exit code
$result = & pwsh scripts/uptime/ping.ps1 -BaseUrl http://localhost:8080
if ($LASTEXITCODE -ne 0) {
    # Send email alert
    Send-MailMessage -To "alerts@example.com" -Subject "Service Down" -Body "Uptime check failed"
}
```

### Slack Webhook

```powershell
if ($LASTEXITCODE -ne 0) {
    $webhook = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    $body = @{text="⚠️ GEO-SEO Service Down"} | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri $webhook -Body $body -ContentType 'application/json'
}
```

## Log Rotation

Prevent log file from growing indefinitely:

```powershell
# Keep last 7 days
$logFile = "D:\GEO_SEO_Domination-Tool\server\logs\uptime\pings.ndjson"
$cutoff = (Get-Date).AddDays(-7)
$lines = Get-Content $logFile | Where-Object {
    $ts = ($_ | ConvertFrom-Json).ts
    [datetime]$ts -gt $cutoff
}
$lines | Set-Content $logFile
```

## Troubleshooting

### "Cannot invoke method" error
- Ensure PowerShell 5.1+ or PowerShell Core 7+
- Check execution policy: `Get-ExecutionPolicy`

### Ping succeeds but not logged
- Verify CRM is running on port 3004
- Check `/api/uptime` endpoint is accessible
- Review CRM logs for errors

### Badge shows "—"
- No pings recorded yet
- Run `pwsh scripts/uptime/ping.ps1` manually
- Check `server/logs/uptime/pings.ndjson` exists

### 24h availability is 0%
- All pings failed in last 24h
- Check target service is running
- Verify network connectivity

## Integration with Other Services

### Prometheus

Export metrics from NDJSON:

```javascript
// Export /metrics endpoint
const logs = fs.readFileSync('server/logs/uptime/pings.ndjson', 'utf8')
const pings = logs.split('\n').filter(Boolean).map(JSON.parse)
const upCount = pings.filter(p => p.ok).length
const totalCount = pings.length
const availability = upCount / totalCount * 100

// Return Prometheus format
`uptime_availability_24h ${availability}
uptime_checks_total ${totalCount}
uptime_checks_success ${upCount}`
```

### Grafana

1. Install Grafana with JSON API plugin
2. Point to `/api/uptime` endpoint
3. Create dashboard with availability graph

## Next Steps

- ✅ Add alerting via email/Slack/Teams
- ✅ Extend to ping multiple endpoints
- ✅ Add response time percentiles (p50, p95, p99)
- ✅ Create weekly/monthly availability reports
- ✅ Integrate with external monitoring (UptimeRobot, Pingdom)

---

**Lightweight, no dependencies, scheduler-ready. Perfect for production monitoring.** ✅
