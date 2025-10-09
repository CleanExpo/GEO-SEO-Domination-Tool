# Bytebot Integration Guide

## Overview

Your GEO-SEO Domination Tool is now integrated with **Bytebot** - an AI-powered desktop agent that can automate complex browser tasks, process documents, and conduct comprehensive research.

Bytebot runs in Docker containers alongside your application, giving you a virtual assistant that can:
- Navigate websites and interact with web applications
- Run SEO audits using real browsers
- Process uploaded documents (PDFs, spreadsheets, images)
- Handle authentication (including 2FA with password managers)
- Work autonomously 24/7 without supervision

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  GEO-SEO Domination Tool (Next.js - Port 3000)              │
│  ├── /api/bytebot/tasks          # Bytebot API proxy       │
│  ├── /lib/bytebot-client.ts      # Bytebot service client  │
│  └── /components/bytebot/         # UI components           │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┬──────────────────┐
          ▼                     ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐
│ Bytebot Agent    │  │ Bytebot Desktop  │  │ Bytebot UI     │
│ (Port 9991)      │  │ (Port 9990)      │  │ (Port 9992)    │
│                  │  │                  │  │                │
│ - AI Planning    │  │ - Ubuntu 22.04   │  │ - Task Mgmt    │
│ - Task Queue     │  │ - Firefox        │  │ - Live View    │
│ - Orchestration  │  │ - VS Code        │  │ - Monitoring   │
└──────────────────┘  └──────────────────┘  └────────────────┘
```

## Services

### 1. **Bytebot Desktop** (Port 9990)
- Ubuntu 22.04 with XFCE desktop environment
- Pre-installed: Firefox, VS Code, Thunderbird, LibreOffice
- Persistent file system at `/home/bytebot`
- VNC access on port 5900 (optional for manual control)

### 2. **Bytebot Agent** (Port 9991)
- NestJS service coordinating AI and desktop actions
- Uses Anthropic Claude / OpenAI GPT / Google Gemini
- Manages task queue and execution
- Stores task state in PostgreSQL

### 3. **Bytebot UI** (Port 9992)
- Next.js web interface for task management
- Live desktop view during task execution
- Task creation, monitoring, and control

## Quick Start

### 1. Start Services

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Check services are running
docker ps | grep bytebot
```

### 2. Access Interfaces

- **Main App**: http://localhost:3000
- **Bytebot UI**: http://localhost:9992
- **Bytebot API**: http://localhost:9991
- **VNC Desktop** (optional): vnc://localhost:5900 (password: `bytebot_vnc_dev`)

### 3. Create Your First Task

```typescript
import { getBytebotClient } from '@/lib/bytebot-client';

const bytebot = getBytebotClient();
const task = await bytebot.createTask(
  'Visit https://example.com and take a screenshot of the homepage',
  { priority: 'MEDIUM' }
);

console.log('Task created:', task.id);
```

## Integration Points

### 1. **Onboarding Research**

When a new client onboards, Bytebot automatically conducts comprehensive research:

**File**: `app/api/onboarding/start/route.ts`

```typescript
// Automatically triggered when onboarding starts
const bytebotTask = await bytebot.createTask(
  buildOnboardingResearchPrompt(clientData),
  {
    priority: 'HIGH',
    metadata: { onboardingId, businessName, website }
  }
);
```

**Research Includes**:
- Website Lighthouse audit
- Google Business Profile check
- SERP analysis for target keywords
- Competitor website analysis
- Local SEO status check
- Comprehensive report generation

### 2. **SEO Audits**

Run comprehensive audits using real browsers:

```typescript
const auditTask = await bytebot.createTask(`
  Complete SEO audit for ${domain}:
  - Run Lighthouse (Performance, SEO, Accessibility, Best Practices)
  - Check robots.txt and sitemap.xml
  - Test mobile responsiveness
  - Extract meta tags and schema markup
  - Analyze internal linking structure
  - Generate audit report with screenshots
`, { priority: 'HIGH' });
```

### 3. **Competitor Research**

```typescript
const researchTask = await bytebot.createTask(`
  Analyze competitors: ${competitors.join(', ')}

  For each:
  - Visit website and capture screenshots
  - Extract meta tags and content strategy
  - Check their Google Business Profile
  - Identify unique selling propositions
  - Compare page speed and technical SEO
  - Generate competitive intelligence report
`, { priority: 'MEDIUM' });
```

### 4. **SERP Position Tracking**

```typescript
const rankingTask = await bytebot.createTask(`
  Track rankings for ${domain}:
  - Keywords: ${keywords.join(', ')}
  - Location: ${location}

  For each keyword:
  - Search Google from ${location}
  - Find ${domain} position (check first 5 pages)
  - Capture SERP screenshot
  - Note SERP features (featured snippets, local pack, etc.)
  - Record top 10 competitors
`, { priority: 'HIGH' });
```

### 5. **Document Processing**

```typescript
const files = [contractPDF, brandGuidelinesPDF];
const analysisTask = await bytebot.createTask(
  'Analyze these client documents and extract: brand voice, target audience, existing SEO strategy',
  { priority: 'MEDIUM', files }
);
```

## API Usage

### Create Task

```bash
curl -X POST http://localhost:3000/api/bytebot/tasks \
  -F "description=Search Google for 'SEO tools' and take a screenshot" \
  -F "priority=MEDIUM"
```

### Get Task Status

```bash
curl http://localhost:3000/api/bytebot/tasks/{taskId}
```

### Get Screenshot

```bash
curl http://localhost:3000/api/bytebot/tasks/{taskId}/screenshot \
  --output screenshot.png
```

### Get Logs

```bash
curl http://localhost:3000/api/bytebot/tasks/{taskId}/logs
```

### Cancel Task

```bash
curl -X DELETE http://localhost:3000/api/bytebot/tasks/{taskId}
```

## UI Components

### BytebotTaskViewer

Display live task execution with desktop view, logs, and results:

```tsx
import { BytebotTaskViewer } from '@/components/bytebot/BytebotTaskViewer';

export function OnboardingPage({ onboardingId, bytebotTaskId }) {
  return (
    <div>
      <h1>Onboarding Research in Progress</h1>
      <BytebotTaskViewer
        taskId={bytebotTaskId}
        autoRefresh={true}
        showDesktopView={true}
        showLogs={true}
        onTaskComplete={(result) => {
          console.log('Research complete!', result);
        }}
      />
    </div>
  );
}
```

## Database Schema

### bytebot_tasks

Tracks Bytebot tasks and their relationships to your entities:

```sql
CREATE TABLE bytebot_tasks (
  id SERIAL PRIMARY KEY,
  bytebot_task_id TEXT UNIQUE,
  description TEXT,
  task_type TEXT, -- 'onboarding', 'audit', 'competitor_research', etc.
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'PENDING',

  -- Relationships
  company_id INTEGER,
  onboarding_id INTEGER,
  audit_id INTEGER,

  -- Data
  metadata JSONB,
  result JSONB,
  error TEXT,
  screenshots JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

## Advanced Features

### 1. **Password Manager Integration**

Install 1Password or Bitwarden in the Bytebot desktop to handle authentication automatically:

```bash
# Access Bytebot desktop via VNC
# Install password manager browser extension
# Configure with your credentials
# Bytebot will use it for automatic login
```

### 2. **Custom Software Installation**

Access the desktop and install any tools you need:

```bash
# Example: Install SEMrush CLI, Screaming Frog, etc.
# These tools persist between tasks
```

### 3. **Direct Desktop Control**

Use low-level desktop actions for scripted automation:

```typescript
const bytebot = getBytebotClient();

// Take screenshot
await bytebot.desktopAction({ action: 'screenshot' });

// Click at coordinates
await bytebot.desktopAction({
  action: 'click_mouse',
  coordinate: [500, 300]
});

// Type text
await bytebot.desktopAction({
  action: 'type_text',
  text: 'Hello, world!'
});
```

### 4. **Task Waiting & Callbacks**

```typescript
// Wait for task to complete (with timeout)
const completedTask = await bytebot.waitForTaskCompletion(taskId, {
  timeout: 300000, // 5 minutes
  pollInterval: 2000 // Check every 2 seconds
});

console.log('Result:', completedTask.result);
```

## Environment Variables

Required environment variables in `.env` or docker-compose:

```env
# AI Provider (choose one or more)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Bytebot URLs (automatically set in Docker)
BYTEBOT_AGENT_URL=http://bytebot-agent:9991
BYTEBOT_DESKTOP_URL=http://bytebot-desktop:9990

# Database (shared with main app)
DATABASE_URL=postgresql://geoseo:password@postgres:5432/geo_seo_db
REDIS_URL=redis://:password@redis:6379
```

## Troubleshooting

### Task Stuck in PENDING

```bash
# Check Bytebot agent logs
docker logs geo-seo-bytebot-agent

# Check desktop is running
docker ps | grep bytebot-desktop
```

### Screenshot Not Loading

```bash
# Check desktop service health
docker exec geo-seo-bytebot-desktop ps aux | grep Xvfb

# Restart desktop if needed
docker restart geo-seo-bytebot-desktop
```

### Task Failed with Error

```bash
# View detailed logs
curl http://localhost:3000/api/bytebot/tasks/{taskId}/logs

# Check agent logs
docker logs geo-seo-bytebot-agent
```

### Desktop Not Accessible via VNC

```bash
# Check VNC port mapping
docker ps | grep bytebot-desktop

# Test connection
nc -zv localhost 5900
```

## Best Practices

### 1. **Task Descriptions**

Be specific and structured in task descriptions:

```typescript
// ❌ Bad
"Check the website"

// ✅ Good
`Visit https://example.com and:
1. Run Lighthouse audit
2. Extract page title and meta description
3. Check mobile responsiveness
4. Capture full-page screenshot
5. Generate summary report`
```

### 2. **Priority Management**

- **URGENT**: Critical client requests, time-sensitive audits
- **HIGH**: New client onboarding, scheduled audits
- **MEDIUM**: Competitor research, general tasks
- **LOW**: Background analysis, non-urgent research

### 3. **File Uploads**

Always upload relevant files for better context:

```typescript
const task = await bytebot.createTask(
  'Analyze this SEO audit and create action plan',
  {
    priority: 'HIGH',
    files: [auditPDF, competitorListCSV],
    metadata: { clientId, companyId }
  }
);
```

### 4. **Error Handling**

```typescript
try {
  const task = await bytebot.createTask(description);

  // Wait with timeout
  const result = await bytebot.waitForTaskCompletion(task.id, {
    timeout: 600000 // 10 minutes
  });

  if (result.status === 'FAILED') {
    console.error('Task failed:', result.error);
    // Handle failure (retry, notify, etc.)
  }
} catch (error) {
  console.error('Bytebot error:', error);
  // Fallback to traditional methods
}
```

## Production Deployment

### Scaling Considerations

For production, consider:

1. **Multiple Desktop Containers**: Run multiple Bytebot desktops for parallel task execution
2. **Task Queue Management**: Implement priority queuing for enterprise load
3. **Resource Limits**: Set CPU/memory limits in docker-compose
4. **Monitoring**: Add health checks and alerting

Example production config:

```yaml
bytebot-desktop:
  image: bytebotai/bytebot-desktop:latest
  deploy:
    replicas: 3  # Multiple desktops for parallel tasks
    resources:
      limits:
        cpus: '2'
        memory: 4G
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9990/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## Support & Resources

- **Bytebot Docs**: https://docs.bytebot.ai
- **Bytebot Discord**: https://discord.gg/bytebot
- **GitHub Issues**: https://github.com/bytebot-ai/bytebot/issues
- **Examples**: https://docs.bytebot.ai/examples

## Next Steps

1. ✅ Services running in Docker
2. ✅ API integration complete
3. ✅ Onboarding enhanced with Bytebot
4. ✅ UI components ready

**Try it out**:
1. Visit http://localhost:3000/onboarding/new
2. Complete a test onboarding
3. Watch Bytebot conduct research in real-time
4. View comprehensive report when complete

**Customize**:
- Add custom research tasks for your industry
- Install specialized SEO tools in the desktop
- Configure password managers for authenticated research
- Build custom UI dashboards for task monitoring

Welcome to the future of AI-powered SEO automation! 🚀
