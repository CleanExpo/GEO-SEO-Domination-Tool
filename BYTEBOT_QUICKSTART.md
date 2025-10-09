# Bytebot Quick Start

## 🚀 Get Running in 5 Minutes

### 1. Start Services

```bash
# Make sure you have the required API keys in your .env file
# ANTHROPIC_API_KEY=sk-ant-...

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Watch the logs
docker-compose -f docker-compose.dev.yml logs -f bytebot-agent
```

### 2. Verify Services

```bash
# Check all services are running
docker ps | grep bytebot

# You should see:
# - geo-seo-bytebot-desktop   (Port 9990, 5900)
# - geo-seo-bytebot-agent     (Port 9991)
# - geo-seo-bytebot-ui        (Port 9992)
```

### 3. Access UIs

- **Your App**: http://localhost:3000
- **Bytebot UI**: http://localhost:9992
- **Live Desktop** (VNC): `vnc://localhost:5900` (password: `bytebot_vnc_dev`)

### 4. Test Integration

Create a test task:

```bash
curl -X POST http://localhost:3000/api/bytebot/tasks \
  -F "description=Visit https://example.com and take a screenshot" \
  -F "priority=MEDIUM"
```

Response:
```json
{
  "success": true,
  "task": {
    "id": "task_123abc",
    "description": "Visit https://example.com and take a screenshot",
    "status": "PENDING",
    "priority": "MEDIUM",
    "createdAt": "2025-01-10T12:00:00Z"
  }
}
```

Check status:
```bash
curl http://localhost:3000/api/bytebot/tasks/task_123abc
```

Get screenshot:
```bash
curl http://localhost:3000/api/bytebot/tasks/task_123abc/screenshot \
  --output screenshot.png
```

## 💼 Real-World Example: Automated Client Onboarding

### Step 1: Client Fills Onboarding Form

Navigate to: http://localhost:3000/onboarding/new

Fill in:
- Business Name: **Acme Coffee Roasters**
- Website: **https://acmecoffee.com**
- Keywords: **coffee roasters near me**, **artisan coffee beans**
- Competitors: **https://bluebottle.com**, **https://intelligentsia.com**

### Step 2: Bytebot Automatically Researches

When you submit, Bytebot will:

1. ✅ Visit client website (acmecoffee.com)
   - Run Lighthouse audit
   - Extract meta tags
   - Check mobile responsiveness
   - Take screenshots

2. ✅ Analyze Google Business Profile
   - Search "Acme Coffee Roasters" on Google Maps
   - Check listing completeness
   - Note reviews and ratings

3. ✅ SERP Research
   - Search for "coffee roasters near me"
   - Capture SERP screenshots
   - Identify where client ranks
   - Note featured snippets and local pack

4. ✅ Competitor Analysis
   - Visit Blue Bottle and Intelligentsia websites
   - Compare page speed
   - Extract their meta strategies
   - Check their GBP listings

5. ✅ Generate Report
   - Comprehensive findings
   - Action items
   - Priority recommendations

### Step 3: View Results

```typescript
// In your dashboard component
import { BytebotTaskViewer } from '@/components/bytebot/BytebotTaskViewer';

<BytebotTaskViewer
  taskId={onboarding.bytebotTaskId}
  autoRefresh={true}
  showDesktopView={true}
  onTaskComplete={(result) => {
    console.log('Research complete!', result);
    // Update onboarding with findings
  }}
/>
```

## 📊 Common Use Cases

### 1. Quick SEO Audit

```typescript
import { getBytebotClient } from '@/lib/bytebot-client';

const bytebot = getBytebotClient();
await bytebot.createTask(`
  SEO Audit for https://example.com:
  - Run Lighthouse
  - Check robots.txt
  - Extract all meta tags
  - Test mobile responsiveness
  - Generate audit report
`, { priority: 'HIGH' });
```

### 2. Competitor Screenshot Comparison

```typescript
await bytebot.createTask(`
  Take homepage screenshots of:
  - https://competitor1.com
  - https://competitor2.com
  - https://competitor3.com

  Save as: competitor1.png, competitor2.png, competitor3.png
`, { priority: 'MEDIUM' });
```

### 3. Local Pack Research

```typescript
await bytebot.createTask(`
  Search Google for "coffee shops in Seattle"

  For the Local Pack results:
  - Capture screenshot
  - List all 3 businesses shown
  - Note their star ratings
  - Check their GBP completeness
  - Identify which have the most reviews
`, { priority: 'HIGH' });
```

### 4. Document Analysis

```typescript
const brandGuidelinePDF = new File(...);
const competitorAnalysisPDF = new File(...);

await bytebot.createTask(
  'Read these PDFs and extract: brand colors, logo variations, typography rules, and competitor strategies',
  {
    priority: 'MEDIUM',
    files: [brandGuidelinePDF, competitorAnalysisPDF]
  }
);
```

## 🛠️ Development Tips

### Monitoring Tasks

```bash
# Watch agent logs in real-time
docker logs -f geo-seo-bytebot-agent

# Watch desktop logs
docker logs -f geo-seo-bytebot-desktop

# Check task status programmatically
curl http://localhost:3000/api/bytebot/tasks/{taskId}
```

### Debugging Issues

```bash
# Connect to desktop via VNC
open vnc://localhost:5900
# Password: bytebot_vnc_dev

# Check desktop processes
docker exec geo-seo-bytebot-desktop ps aux

# Restart desktop if needed
docker restart geo-seo-bytebot-desktop
```

### Performance Tuning

```yaml
# docker-compose.dev.yml
bytebot-desktop:
  shm_size: '4gb'  # Increase for heavy browser usage
  deploy:
    resources:
      limits:
        cpus: '4'    # More CPU for faster execution
        memory: 8G   # More memory for multiple tabs
```

## 🔧 Configuration

### Change AI Provider

```env
# Use OpenAI instead of Claude
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=  # Comment out

# Or use both (agent will choose based on task)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Install Additional Software

```bash
# Access desktop via VNC
open vnc://localhost:5900

# In desktop terminal:
sudo apt-get update
sudo apt-get install screaming-frog chromium-browser

# Software persists between tasks!
```

### Configure Password Manager

1. Access desktop via VNC: `vnc://localhost:5900`
2. Open Firefox
3. Install 1Password extension
4. Log in with your credentials
5. Bytebot will now use it for automatic authentication!

## 📈 Next Steps

### Production Readiness

1. **Add Monitoring**
   ```typescript
   // Log all task completions
   onTaskComplete={(result) => {
     analytics.track('bytebot_task_completed', {
       taskType: result.task_type,
       duration: result.duration,
       success: result.status === 'COMPLETED'
     });
   }}
   ```

2. **Error Handling**
   ```typescript
   try {
     const task = await bytebot.createTask(description);
     const result = await bytebot.waitForTaskCompletion(task.id);

     if (result.status === 'FAILED') {
       // Retry logic or fallback
       await retryTask(task);
     }
   } catch (error) {
     // Alert on critical failures
     await notifyAdmin('Bytebot task failed', error);
   }
   ```

3. **Scale for Production**
   ```yaml
   bytebot-desktop:
     deploy:
       replicas: 5  # Run 5 desktops for parallel tasks
   ```

### Custom Integrations

1. **Webhook Notifications**
   ```typescript
   // Get notified when tasks complete
   await bytebot.createTask(description, {
     metadata: {
       webhookUrl: 'https://yourapp.com/api/bytebot-webhook'
     }
   });
   ```

2. **Scheduled Tasks**
   ```typescript
   // Check rankings daily
   cron.schedule('0 6 * * *', async () => {
     await bytebot.createTask('Daily ranking check for all clients');
   });
   ```

3. **Batch Processing**
   ```typescript
   // Process multiple clients in parallel
   await Promise.all(
     clients.map(client =>
       bytebot.createTask(`Audit ${client.website}`)
     )
   );
   ```

## 🎯 Pro Tips

1. **Structure task descriptions** - Use clear sections, bullets, and numbering
2. **Use metadata** - Store context for linking tasks back to your entities
3. **Auto-refresh screenshots** - Set `refreshInterval={2000}` in BytebotTaskViewer
4. **Install specialized tools** - SEO tools persist in the desktop between tasks
5. **Use priority wisely** - URGENT for time-sensitive, HIGH for clients, MEDIUM for research

## 🆘 Help & Support

**Issues?**
- Check logs: `docker logs geo-seo-bytebot-agent`
- Review docs: [BYTEBOT_INTEGRATION.md](./BYTEBOT_INTEGRATION.md)
- Bytebot Discord: https://discord.gg/bytebot

**Questions?**
- Integration guide: [BYTEBOT_INTEGRATION.md](./BYTEBOT_INTEGRATION.md)
- Bytebot docs: https://docs.bytebot.ai
- GitHub: https://github.com/bytebot-ai/bytebot

---

**You're all set!** 🎉

Bytebot is now your AI research assistant, handling the tedious work so you can focus on strategy and client relationships.
