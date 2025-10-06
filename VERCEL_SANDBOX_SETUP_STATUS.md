# Vercel Coding Agent Integration Status

**Branch**: `qwen-omni`
**Date**: 2025-01-06
**Status**: ✅ Phase 1 Complete - Database Schema Adapted

---

## ✅ Completed Steps

### 1. Repository Cloned
- **Location**: `tools/coding-agent/`
- **Source**: https://github.com/vercel-labs/coding-agent-template
- **Status**: ✅ Successfully cloned
- **Dependencies**: Installing (pnpm install in progress)

### 2. Database Schema Adapted
- **File**: `tools/coding-agent/lib/db/schema-adapted.ts`
- **Changes**:
  - Maps Vercel's `tasks` table → MetaCoder's `sandbox_tasks` + `sandbox_sessions`
  - Added UUID primary keys (matches MetaCoder convention)
  - Added `session_id` foreign key to link tasks to sandbox sessions
  - Added cost tracking fields (`tokens_used`, `cost_usd`, etc.)
  - Created adapter functions: `createSandboxTask()`, `updateSandboxTaskStatus()`
  - Maps Vercel agent names (`claude`, `codex`) to MetaCoder agent types (`builder`, etc.)

### 3. Database Migration Created
- **File**: `database/migrations/011_add_sandbox_tasks.sql`
- **Features**:
  - Creates `sandbox_tasks` table with full MetaCoder compatibility
  - Auto-updating timestamps trigger
  - Constraint checks for valid status and agent values
  - Indexes for performance (session_id, status, agent, cost)
  - New view: `sandbox_task_analytics` (success rates, costs per agent)
  - Updated view: `active_sandbox_sessions` (includes task counts)
  - Updated function: `get_sandbox_session_stats()` (includes task metrics)

### 4. Environment Configuration
- **File**: `tools/coding-agent/.env`
- **Configuration**:
  - Vercel Sandbox settings (VERCEL_TEAM_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN)
  - Claude Code Max Plan (ANTHROPIC_API_KEY)
  - GitHub integration (GITHUB_TOKEN)
  - Shared Supabase database (same as main CRM)
  - Optional: Codex, Cursor, Gemini agents
- **Status**: ✅ Template created (needs user to fill in API keys)

---

## 📋 Next Steps (User Action Required)

### Step 1: Wait for pnpm Installation
The `pnpm install` is still running. Wait for it to complete (visible as 454 packages being installed).

### Step 2: Fill in Environment Variables
Edit `tools/coding-agent/.env` with your actual API keys:

```bash
# Required
VERCEL_TEAM_ID=team_xxxxx              # Get from Vercel Dashboard → Settings → Team ID
VERCEL_PROJECT_ID=prj_xxxxx            # Get from Vercel Project → Settings → Project ID
VERCEL_TOKEN=xxxxxx                    # Create at Vercel → Account Settings → Tokens
POSTGRES_URL=postgresql://...          # Use SAME Supabase URL as web-app (from main .env)
ANTHROPIC_API_KEY=sk-ant-xxxxx        # Use SAME key from main .env (your Max Plan!)
GITHUB_TOKEN=ghp_xxxxx                 # Create at https://github.com/settings/tokens

# Optional (for additional agents)
OPENAI_API_KEY=sk-xxxxx               # For GPT-5 Codex (when available)
CURSOR_API_KEY=xxxxx                  # For Cursor integration
GEMINI_API_KEY=xxxxx                  # For Google Gemini
```

### Step 3: Run Database Migration
After filling in the Supabase URL, run the migration:

```bash
# From root directory
npm run db:migrate

# Or manually via Supabase SQL Editor:
# Run: database/migrations/011_add_sandbox_tasks.sql
```

This will create the `sandbox_tasks` table in your Supabase database.

### Step 4: Test Vercel Template Locally
Once pnpm install completes and .env is configured:

```bash
cd tools/coding-agent
pnpm run db:push              # Push schema to database
pnpm dev                      # Start Next.js dev server
```

Open `http://localhost:3000` to verify the Vercel template UI loads.

### Step 5: Verify Database Connection
Check that the template can connect to your Supabase database:

```bash
cd tools/coding-agent
pnpm run db:studio            # Opens Drizzle Studio to browse database
```

You should see the `sandbox_tasks` table alongside existing MetaCoder tables.

---

## 🎯 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Main CRM (web-app/)                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /sandbox Page (TO BE BUILT)                           │ │
│  │  - Session management UI                               │ │
│  │  - Task creation form                                  │ │
│  │  - Live log viewer (VS Code terminal experience)      │ │
│  │  - File tree browser                                   │ │
│  │  - Live preview panel                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP API calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Coding Agent (tools/coding-agent/)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (/api/tasks/*)                             │ │
│  │  - POST /api/tasks/create → createSandboxTask()        │ │
│  │  - GET /api/tasks/:id → fetch task status             │ │
│  │  - POST /api/tasks/:id/stop → stop task execution     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Agent Executors (lib/agents/*)                        │ │
│  │  - claude-code.ts (your Max Plan!)                     │ │
│  │  - codex.ts (GPT-5 Codex)                             │ │
│  │  - cursor.ts (Cursor Composer)                         │ │
│  │  - gemini.ts (Google Gemini)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Database queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Shared Supabase Database                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  MetaCoder Tables (existing)                           │ │
│  │  - sandbox_sessions (main session state)               │ │
│  │  - sandbox_agent_logs (AI interaction logs)            │ │
│  │  - sandbox_terminal_history (command history)          │ │
│  │  - sandbox_deployments (Vercel deployments)            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  NEW: sandbox_tasks (Vercel compatibility)             │ │
│  │  - Links to sandbox_sessions via session_id            │ │
│  │  - Tracks code generation tasks                        │ │
│  │  - Logs execution status, costs, results              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Execution
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Sandbox (isolated container)                        │
│  - Executes code securely                                   │
│  - Runs Claude Code CLI                                     │
│  - Captures logs and results                                │
│  - Returns to agent executor                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Design Decisions

### 1. Shared Database Strategy
**Decision**: Use the SAME Supabase database for both main CRM and Vercel template
**Why**:
- Single source of truth for all sandbox data
- No data sync required between systems
- Cost tracking across both systems unified
- Session state accessible from both UIs

### 2. Schema Adapter Pattern
**Decision**: Create adapter layer instead of modifying Vercel template directly
**Why**:
- Preserves ability to update Vercel template from upstream
- Maintains compatibility with both systems
- Adapter functions handle differences transparently
- Easy to extend for future features

### 3. UUID Primary Keys
**Decision**: Use UUID instead of Vercel's text IDs
**Why**:
- Matches MetaCoder convention (all tables use UUIDs)
- Better for distributed systems
- Prevents ID collisions across sessions
- Supabase native UUID support (`gen_random_uuid()`)

### 4. Claude Code as Primary Agent
**Decision**: Default to Claude Code with user's Max Plan
**Why**:
- User already has Max Plan subscription
- Higher token limits (8000 vs 4000)
- Extended context window
- Best-in-class code generation
- Other agents (Codex, Cursor, Gemini) as optional fallbacks

---

## 📊 Database Schema Mapping

| Vercel Field | MetaCoder Field | Notes |
|-------------|-----------------|-------|
| `id` (text) | `id` (UUID) | Changed to UUID for consistency |
| `prompt` | `prompt` | Same |
| `repoUrl` | `repo_url` | Snake case convention |
| `selectedAgent` | `selected_agent` | Maps to `agent_type` in logs |
| `selectedModel` | `selected_model` | Maps to `ai_model` in logs |
| `status` | `status` | Same enum values |
| `logs` (JSON) | `logs` (JSONB) | PostgreSQL JSONB type |
| - | `session_id` | **NEW**: Links to sandbox_sessions |
| - | `tokens_used` | **NEW**: Cost tracking |
| - | `cost_usd` | **NEW**: Cost tracking |

---

## 💰 Cost Tracking Integration

The adapted schema logs costs in TWO places:

1. **sandbox_tasks**: Per-task cost tracking
   - Direct costs for each code generation task
   - Aggregated in `sandbox_task_analytics` view

2. **sandbox_agent_logs**: Per-interaction cost tracking
   - Existing MetaCoder logging
   - Updated by adapter functions
   - Aggregated in `sandbox_ai_cost_analysis` view

**Total Cost Query**:
```sql
SELECT
  SUM(cost_usd) as total_sandbox_cost
FROM (
  SELECT cost_usd FROM sandbox_tasks
  UNION ALL
  SELECT cost_usd FROM sandbox_agent_logs
) combined_costs;
```

---

## 🚧 Remaining Work (Week 2-3)

### Week 2: CRM UI Integration

1. **Create /sandbox Page** (`web-app/app/sandbox/page.tsx`)
   - Session selector dropdown
   - "New Session" button
   - Active session stats display

2. **Build Task Creation Form** (`web-app/components/sandbox/TaskForm.tsx`)
   - Prompt input (multiline textarea)
   - Repository URL input (optional)
   - Agent selector (Claude, Codex, Cursor, Gemini)
   - Model selector (auto-populated based on agent)
   - "Generate Code" button

3. **Implement Log Viewer** (`web-app/components/sandbox/LogViewer.tsx`)
   - Real-time log streaming (WebSocket or polling)
   - Syntax highlighting for code blocks
   - Collapsible log entries
   - Download logs button

4. **Add File Tree Browser** (`web-app/components/sandbox/FileTree.tsx`)
   - Renders `file_tree` JSON from session
   - Click to open file
   - Highlight current file
   - New file/folder buttons

5. **Create Live Preview Panel** (`web-app/components/sandbox/LivePreview.tsx`)
   - Iframe for Vercel preview URL
   - "Open in New Tab" button
   - Console log viewer
   - Network request inspector

6. **API Route Integration**
   - `web-app/app/api/sandbox/tasks/route.ts` → Proxy to Vercel template
   - WebSocket server for real-time logs

### Week 3: Testing & Optimization

1. **End-to-End Testing**
   - User creates session
   - User submits task ("Create a React ranking widget")
   - Claude Code generates code in Vercel Sandbox
   - Logs stream to UI
   - Code is committed to branch
   - Preview URL opens in Live Preview panel

2. **Cost Optimization**
   - Implement smart routing (Router Agent)
   - Use DeepSeek V3 for simple tasks ($0.27/M tokens vs $3/M)
   - Reserve Claude Code Max for complex tasks

3. **Performance Tuning**
   - Optimize log streaming (batch updates every 500ms)
   - Implement virtual scrolling for large log files
   - Cache session stats in Redis

---

## 📝 Files Created in This Phase

1. ✅ `tools/coding-agent/` (cloned from Vercel)
2. ✅ `tools/coding-agent/lib/db/schema-adapted.ts` (adapter layer)
3. ✅ `tools/coding-agent/.env` (configuration template)
4. ✅ `database/migrations/011_add_sandbox_tasks.sql` (database migration)
5. ✅ `VERCEL_SANDBOX_SETUP_STATUS.md` (this file)

---

## 🎯 Success Criteria

**Phase 1 Complete** ✅ when:
- [x] Vercel template cloned to `tools/coding-agent/`
- [x] Database schema adapted to MetaCoder
- [x] Migration file created
- [x] Environment template created
- [ ] User fills in API keys (PENDING)
- [ ] Migration runs successfully (PENDING)

**Phase 2 Complete** when:
- [ ] `/sandbox` page exists in main CRM
- [ ] User can create new sandbox session
- [ ] User can submit code generation task
- [ ] Logs stream to UI in real-time
- [ ] Generated code creates branch + commit
- [ ] Live preview opens automatically

**Phase 3 Complete** when:
- [ ] End-to-end test passes
- [ ] Smart routing implemented
- [ ] Cost tracking dashboard exists
- [ ] Performance metrics < 500ms log update

---

## 🔗 Related Documentation

- `VERCEL_CODING_AGENT_INTEGRATION.md` - Complete integration plan (642 lines)
- `database/sandbox-schema.sql` - MetaCoder sandbox schema
- `WEEK_1_IMPLEMENTATION_GUIDE.md` - Qwen3-Omni + DashScope setup
- `CUA_INTEGRATION_PLAN.md` - VM automation integration

---

## 🆘 Troubleshooting

### pnpm install fails
**Solution**: Install pnpm globally: `npm install -g pnpm`

### Database migration fails
**Solution**: Check `POSTGRES_URL` is correct. Run migration manually via Supabase SQL Editor.

### Vercel Sandbox connection fails
**Solution**: Verify `VERCEL_TOKEN` has correct permissions (read/write). Check Team ID and Project ID match your Vercel project.

### Claude Code not working
**Solution**: Verify `ANTHROPIC_API_KEY` is correct. Check API key has sufficient credits. Confirm Max Plan is active.

---

**Next Command to Run**:
```bash
# Once pnpm install completes:
cd tools/coding-agent
pnpm run db:push
pnpm dev

# Then open http://localhost:3000 to verify UI loads
```
