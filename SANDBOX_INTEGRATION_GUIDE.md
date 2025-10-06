# MetaCoder Sandbox Integration Guide

**Date**: 2025-10-06
**Status**: ✅ Phase 1 Complete - AI SDK Integration

---

## What Was Implemented

### 1. ✅ Vercel AI SDK Integration

**Packages Installed**:
```bash
npm install ai @ai-sdk/react @ai-sdk/openai @anthropic-ai/sdk
```

**What It Does**:
- Provides unified interface for multiple AI providers (Claude, OpenAI, etc.)
- Enables streaming responses for real-time code generation
- Simplifies agent switching with consistent API

**Files Created/Modified**:
- `web-app/app/api/sandbox/chat/route.ts` - NEW streaming chat API endpoint
- `web-app/components/sandbox/TaskForm.tsx` - UPDATED to use `useChat` hook

### 2. ✅ E2B SDK Integration

**Package Installed**:
```bash
npm install @e2b/code-interpreter
```

**What It Does**:
- Provides secure sandboxed code execution
- Isolates user-generated code from production environment
- Supports package installation (npm, pip)
- Enables real-time code execution without deployment

**Status**: Installed but not yet integrated (Phase 2)

### 3. ✅ Sandpack Integration

**Package Installed**:
```bash
npm install @codesandbox/sandpack-react
```

**What It Does**:
- In-browser code bundling and execution
- Live preview without backend deployment
- CodeSandbox-powered environment
- Hot module reloading

**Files Created**:
- `web-app/components/sandbox/SandpackPreview.tsx` - NEW Sandpack preview component

---

## Environment Variables Required

Add these to Vercel environment variables:

### AI Providers

```env
# Anthropic (Claude Code)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI (GPT-4, Codex)
OPENAI_API_KEY=sk-...

# E2B (Secure Code Execution)
E2B_API_KEY=...
```

### How to Add in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `geo-seo-domination-tool`
3. Settings → Environment Variables
4. Add each variable for Production, Preview, and Development
5. Redeploy to activate

---

## Architecture Changes

### Before (Week 2)

```
TaskForm → API Route → Supabase → Manual Task Creation
```

### After (Week 3 - Current)

```
TaskForm → useChat Hook → Streaming API → AI Provider → Real-time Response
         ↓
         Task Record Created in Supabase
         ↓
         SandpackPreview → In-Browser Execution
```

### Flow Diagram

```
┌──────────────┐
│  TaskForm    │
│  (useChat)   │
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│ /api/sandbox/chat    │
│ (Vercel AI SDK)      │
└──────┬───────────────┘
       │
       ├─────────────────┐
       │                 │
       ↓                 ↓
┌─────────────┐   ┌─────────────┐
│  Anthropic  │   │  OpenAI     │
│  (Claude)   │   │  (GPT-4)    │
└─────────────┘   └─────────────┘
       │                 │
       └────────┬────────┘
                ↓
       ┌────────────────┐
       │  Streaming     │
       │  Response      │
       └────────┬───────┘
                │
       ┌────────┴────────┐
       │                 │
       ↓                 ↓
┌─────────────┐   ┌─────────────┐
│  Supabase   │   │  Sandpack   │
│  (Storage)  │   │  (Preview)  │
└─────────────┘   └─────────────┘
```

---

## How It Works Now

### 1. User Submits Task

User enters prompt in TaskForm:
```
Prompt: "Create a React dashboard with charts"
Agent: Claude Code (Max Plan)
```

### 2. Streaming Starts

TaskForm uses `useChat` hook to initiate streaming:

```typescript
const { messages, append, isLoading } = useChat({
  api: '/api/sandbox/chat',
  body: { agent: 'claude', sessionId, taskId },
  onResponse: async (response) => {
    // Create task record in Supabase
  },
})
```

### 3. API Route Processes Request

`/api/sandbox/chat/route.ts` receives request and:
- Selects AI provider based on agent selection
- Streams response back to client
- Uses Edge runtime for optimal performance

```typescript
const result = streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  messages,
  system: "You are an expert software developer...",
})

return result.toDataStreamResponse()
```

### 4. Real-time Updates

Client receives streaming response:
- Messages update in real-time
- Code appears incrementally
- No page refresh needed

### 5. Live Preview (Sandpack)

Generated code renders in SandpackPreview:
- In-browser bundling
- Live React preview
- No deployment needed

---

## API Endpoints

### POST /api/sandbox/chat

**Purpose**: Stream AI code generation responses

**Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "Create a React component..." }
  ],
  "agent": "claude",
  "sessionId": "uuid",
  "taskId": "uuid"
}
```

**Response**: Server-Sent Events (SSE) stream

**Supported Agents**:
- `claude` - Claude Sonnet 4.5 (Anthropic)
- `codex` - GPT-4 (OpenAI placeholder)
- `cursor` - GPT-4 (OpenAI placeholder)
- `gemini` - GPT-4 (OpenAI placeholder)
- `opencode` - GPT-4 (OpenAI placeholder)

### POST /api/sandbox/tasks

**Purpose**: Create task record in Supabase

**Request Body**:
```json
{
  "session_id": "uuid",
  "prompt": "Create a React component...",
  "selected_agent": "claude",
  "selected_model": "claude-sonnet-4-5-20250929",
  "install_dependencies": false,
  "max_duration": 5
}
```

**Response**:
```json
{
  "task": {
    "id": "uuid",
    "session_id": "uuid",
    "status": "pending",
    "created_at": "2025-10-06T..."
  }
}
```

---

## Component Usage

### TaskForm with Streaming

```tsx
import TaskForm from '@/components/sandbox/TaskForm'

<TaskForm
  sessionId={sessionId}
  onTaskCreated={(task) => {
    console.log('Task created:', task)
    // Update UI, show logs, etc.
  }}
/>
```

**Features**:
- ✅ Real-time streaming with `useChat`
- ✅ Automatic task record creation
- ✅ Error handling with `onError` callback
- ✅ Loading states with `isLoading`

### SandpackPreview

```tsx
import SandpackPreview from '@/components/sandbox/SandpackPreview'

<SandpackPreview
  files={{
    '/App.js': 'export default function App() {...}',
    '/package.json': '{"dependencies": {...}}',
  }}
  sessionId={sessionId}
/>
```

**Features**:
- ✅ In-browser code execution
- ✅ Hot module reloading
- ✅ Multi-file support
- ✅ Dark theme
- ✅ Error display

---

## Testing Locally

### 1. Install Dependencies

```bash
cd web-app
npm install
```

### 2. Set Environment Variables

Create `web-app/.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Test Sandbox

1. Navigate to http://localhost:3000/sandbox
2. Create a new session
3. Submit a task:
   ```
   Prompt: Create a React button component with Tailwind CSS
   Agent: Claude Code (Max Plan)
   ```
4. Watch streaming response in real-time
5. See live preview in Sandpack

---

## Next Steps (Phase 2)

### Week 4: E2B Integration

**Tasks**:
1. Create `/api/sandbox/execute` endpoint using E2B SDK
2. Execute user code in isolated sandbox
3. Stream execution logs back to client
4. Handle package installation requests

**Example E2B Usage**:

```typescript
import { CodeInterpreter } from '@e2b/code-interpreter'

const sandbox = await CodeInterpreter.create()

// Execute code
const execution = await sandbox.notebook.execCell(generatedCode)

// Get output
console.log(execution.logs.stdout)
console.log(execution.logs.stderr)

// Install packages
await sandbox.notebook.execCell('!pip install pandas')

await sandbox.close()
```

### Week 5: Advanced Features

**Tasks**:
1. File tree synchronization with Sandpack
2. WebSocket log streaming
3. Multi-file code generation
4. Git integration for code commits
5. PWA features (offline support, installability)

---

## Troubleshooting

### Error: "Module not found: Can't resolve 'ai'"

**Solution**: Ensure you're in `web-app/` directory when running `npm install ai`

```bash
cd web-app
npm install ai @ai-sdk/react
```

### Error: "ANTHROPIC_API_KEY is not defined"

**Solution**: Add environment variable in Vercel or `.env.local`

```bash
# Vercel
vercel env add ANTHROPIC_API_KEY production

# Local
echo "ANTHROPIC_API_KEY=sk-ant-..." >> web-app/.env.local
```

### Streaming Not Working

**Check**:
1. API route uses `export const runtime = 'edge'`
2. Response uses `.toDataStreamResponse()`
3. Client uses `useChat` hook (not manual fetch)

### Sandpack Not Rendering

**Check**:
1. Files object has at least one entry
2. File paths start with `/` (e.g., `/App.js`)
3. Template is valid (react, vanilla, vue, etc.)

---

## Performance Considerations

### Edge Runtime

All AI API routes use Edge runtime for:
- Lower latency (deployed globally)
- Faster cold starts
- Better streaming performance

### Streaming Benefits

- Reduces perceived latency (shows progress immediately)
- Better user experience (incremental updates)
- Lower memory usage (doesn't buffer entire response)

### Sandpack Optimization

- Uses Web Workers for bundling
- Lazy loads dependencies
- Caches bundled code

---

## Security

### API Key Protection

- ✅ All API keys stored in environment variables
- ✅ Never exposed to client
- ✅ API routes run on server/edge

### Sandpack Isolation

- ✅ Code runs in iframe sandbox
- ✅ Limited permissions (`allow-scripts`, `allow-same-origin`)
- ✅ No access to parent window

### E2B Isolation (When Integrated)

- ✅ Each execution in isolated container
- ✅ Automatic cleanup after execution
- ✅ Network restrictions configurable

---

## Resources

### Documentation

- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **E2B Docs**: https://e2b.dev/docs
- **Sandpack Docs**: https://sandpack.codesandbox.io/
- **Anthropic API**: https://docs.anthropic.com/

### Example Projects

- **E2B Fragments**: https://github.com/e2b-dev/fragments
- **Vercel AI Chatbot**: https://github.com/vercel/ai-chatbot
- **Next.js AI Page Generator**: https://github.com/cameronking4/nextjs-ai-page-generator

---

## Summary

**Completed** ✅:
1. Installed Vercel AI SDK (ai, @ai-sdk/react, @ai-sdk/openai, @anthropic-ai/sdk)
2. Installed E2B SDK (@e2b/code-interpreter)
3. Installed Sandpack (@codesandbox/sandpack-react)
4. Created streaming chat API endpoint
5. Updated TaskForm to use `useChat` hook
6. Created SandpackPreview component

**Benefits**:
- ✅ Real-time streaming code generation
- ✅ Multi-provider AI support (easy to switch agents)
- ✅ In-browser code preview (no deployment needed)
- ✅ Production-ready architecture

**Next Actions**:
1. Add environment variables to Vercel (ANTHROPIC_API_KEY, OPENAI_API_KEY)
2. Commit and deploy changes
3. Test streaming in production
4. Begin Phase 2 (E2B execution integration)

---

**Status**: Ready for deployment and testing 🚀
