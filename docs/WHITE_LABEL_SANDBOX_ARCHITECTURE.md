# White-Label Claude Code Sandbox Architecture

## Overview

Transform the GEO-SEO CRM into a multi-tenant AI development platform with embedded Claude Code capabilities, allowing you to manage your own work and client projects in isolated, white-labeled environments.

## Core Vision

**Problem**: Managing multiple client projects requires context switching between tools (VS Code, Claude, CRM, docs)
**Solution**: Unified platform where each client gets their own AI-powered development sandbox with full project lifecycle management

## Architecture Layers

### 1. Multi-Tenant Workspace System

```
CRM Root
├── Your Personal Workspace (Owner)
│   ├── Claude Code Terminal (Full Access)
│   ├── Project Files (All Your Businesses)
│   ├── Agent Orchestration Dashboard
│   └── Global Settings
│
└── Client Workspaces (Isolated)
    ├── Client A
    │   ├── Limited Claude Code Terminal
    │   ├── Project-Specific Files
    │   ├── Assigned Agents (SEO, Content, etc.)
    │   └── Client-Visible Dashboard
    │
    └── Client B
        └── [Same structure]
```

### 2. White-Labeled Terminal Integration

**Component**: Embedded Monaco Editor + Claude Code CLI
**Location**: `app/sandbox/terminal/page.tsx` (already exists)
**Enhancement Needed**: Windows Process Management

#### Windows Terminal Integration (PowerShell/CMD)

```typescript
// services/terminal/windows-terminal-service.ts
import { spawn, ChildProcess } from 'child_process';
import * as pty from 'node-pty';

export class WindowsTerminalService {
  private terminals: Map<string, ChildProcess> = new Map();

  // Create isolated terminal session per workspace
  createTerminal(workspaceId: string, clientId: string): string {
    const shell = process.env.SHELL || 'powershell.exe';
    const workingDir = `D:/GEO_SEO_Domination-Tool/workspaces/${clientId}/${workspaceId}`;

    // Use node-pty for Windows pseudo-terminal
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: workingDir,
      env: {
        ...process.env,
        CLAUDE_WORKSPACE: workspaceId,
        CLIENT_ID: clientId,
        // White-label branding
        TERMINAL_TITLE: 'GEO-SEO AI Terminal'
      }
    });

    const sessionId = `term_${Date.now()}`;
    this.terminals.set(sessionId, ptyProcess);

    return sessionId;
  }

  // Execute Claude Code commands
  async executeClaudeCommand(sessionId: string, command: string): Promise<string> {
    const terminal = this.terminals.get(sessionId);
    if (!terminal) throw new Error('Terminal not found');

    return new Promise((resolve, reject) => {
      let output = '';
      terminal.on('data', (data: string) => {
        output += data;
      });

      terminal.write(`${command}\n`);

      // Wait for command completion indicator
      setTimeout(() => resolve(output), 1000);
    });
  }
}
```

### 3. Autonomous SDK Agent Framework

**Based on Anthropic's Agent Architecture**

#### Agent Types

1. **SEO Audit Agent** (Background Worker)
   - Runs Lighthouse audits
   - Monitors ranking changes
   - Generates weekly reports
   - **Runs autonomously without blocking main workflow**

2. **Content Generation Agent**
   - Analyzes competitor content
   - Generates SEO-optimized articles
   - Creates meta descriptions
   - **Works in parallel with other agents**

3. **GitHub Integration Agent**
   - Syncs code changes
   - Creates PRs automatically
   - Manages deployment pipeline
   - **Handles version control autonomously**

4. **Client Onboarding Agent**
   - Captures client requirements
   - Generates project structure
   - Sets up tracking dashboards
   - **Runs initial setup tasks in background**

#### Agent Pool Implementation

```typescript
// services/agents/agent-pool.ts
import { Anthropic } from '@anthropic-ai/sdk';

interface AgentTask {
  id: string;
  agentType: 'seo-audit' | 'content-gen' | 'github-sync' | 'onboarding';
  workspaceId: string;
  clientId: string;
  payload: any;
  priority: 'high' | 'medium' | 'low';
  status: 'queued' | 'running' | 'completed' | 'failed';
}

export class AutonomousAgentPool {
  private anthropic: Anthropic;
  private runningAgents: Map<string, AbortController> = new Map();
  private taskQueue: AgentTask[] = [];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  // Add task to background queue
  queueTask(task: AgentTask): string {
    this.taskQueue.push(task);
    this.processQueue(); // Non-blocking
    return task.id;
  }

  // Process tasks in background
  private async processQueue() {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;

      // Run agent in background (non-blocking)
      this.runAgent(task).catch(err => {
        console.error(`Agent ${task.agentType} failed:`, err);
        task.status = 'failed';
      });
    }
  }

  // Execute autonomous agent with subagents
  private async runAgent(task: AgentTask) {
    const controller = new AbortController();
    this.runningAgents.set(task.id, controller);
    task.status = 'running';

    // Load agent-specific system prompt
    const systemPrompt = await this.getAgentPrompt(task.agentType);

    // Load agent-specific tools
    const tools = this.getAgentTools(task.agentType);

    try {
      // Run agent with Claude SDK
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4.5-20250929',
        max_tokens: 8192,
        system: systemPrompt,
        tools: tools,
        messages: [{
          role: 'user',
          content: this.buildAgentPrompt(task)
        }]
      }, {
        signal: controller.signal
      });

      // Process tool calls autonomously
      await this.processToolCalls(response, task);

      task.status = 'completed';
    } finally {
      this.runningAgents.delete(task.id);
    }
  }

  // Agent-specific tool definitions
  private getAgentTools(agentType: string) {
    const toolLibrary = {
      'seo-audit': [
        { name: 'run_lighthouse_audit', description: 'Run Lighthouse performance audit' },
        { name: 'check_ranking_position', description: 'Check keyword ranking position' },
        { name: 'generate_seo_report', description: 'Generate comprehensive SEO report' }
      ],
      'content-gen': [
        { name: 'analyze_competitors', description: 'Analyze competitor content strategies' },
        { name: 'generate_article', description: 'Generate SEO-optimized article' },
        { name: 'create_meta_tags', description: 'Create optimized meta descriptions' }
      ],
      'github-sync': [
        { name: 'create_branch', description: 'Create new Git branch' },
        { name: 'commit_changes', description: 'Commit and push changes' },
        { name: 'create_pull_request', description: 'Create PR with description' }
      ],
      'onboarding': [
        { name: 'create_workspace', description: 'Set up client workspace' },
        { name: 'initialize_project', description: 'Initialize project structure' },
        { name: 'setup_tracking', description: 'Configure analytics tracking' }
      ]
    };

    return toolLibrary[agentType] || [];
  }
}
```

### 4. Client Workspace Isolation

**Database Schema Extension**

```sql
-- Migration: Add workspace isolation tables

CREATE TABLE client_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES companies(id),
  workspace_name VARCHAR(255) NOT NULL,
  workspace_path TEXT NOT NULL, -- Windows filesystem path
  created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,

  -- White-label branding
  brand_name VARCHAR(255),
  brand_logo_url TEXT,
  brand_primary_color VARCHAR(7), -- Hex color

  -- Resource limits
  max_agents INTEGER DEFAULT 5,
  max_storage_mb INTEGER DEFAULT 1024,

  UNIQUE(client_id, workspace_name)
);

CREATE TABLE workspace_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES client_workspaces(id),
  agent_type VARCHAR(50) NOT NULL,
  agent_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  total_runs INTEGER DEFAULT 0
);

CREATE TABLE agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES workspace_agents(id),
  task_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed')),
  output_summary TEXT,
  error_message TEXT
);
```

### 5. VS Code-Like UI Components

**Terminal Interface** (Monaco Editor + xterm.js)

```tsx
// app/sandbox/components/WhiteLabelTerminal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import Editor from '@monaco-editor/react';

export function WhiteLabelTerminal({ workspaceId, clientId, brandConfig }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal>();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js terminal
    terminal.current = new Terminal({
      theme: {
        background: brandConfig?.primaryColor || '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.current.loadAddon(fitAddon);
    terminal.current.loadAddon(webLinksAddon);
    terminal.current.open(terminalRef.current);
    fitAddon.fit();

    // Connect to backend Windows terminal via WebSocket
    const ws = new WebSocket(`ws://localhost:3000/api/terminal/${workspaceId}`);

    ws.onmessage = (event) => {
      terminal.current?.write(event.data);
    };

    terminal.current.onData((data) => {
      ws.send(data);
    });

    // Display white-label branding
    terminal.current.writeln(`\x1b[1;32m${brandConfig?.brandName || 'GEO-SEO AI'} Terminal\x1b[0m`);
    terminal.current.writeln('Type "claude help" to get started\n');

    return () => {
      ws.close();
      terminal.current?.dispose();
    };
  }, [workspaceId, clientId, brandConfig]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header with branding */}
      <div className="bg-gray-900 px-4 py-2 flex items-center gap-2">
        {brandConfig?.logoUrl && (
          <img src={brandConfig.logoUrl} alt="Brand" className="h-6" />
        )}
        <span className="text-white font-semibold">
          {brandConfig?.brandName || 'AI Development Terminal'}
        </span>
      </div>

      {/* Split view: Code Editor + Terminal */}
      <div className="flex-1 grid grid-cols-2 gap-0">
        {/* Monaco Editor */}
        <div className="border-r border-gray-700">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
            }}
          />
        </div>

        {/* Terminal */}
        <div ref={terminalRef} className="bg-[#1e1e1e]" />
      </div>
    </div>
  );
}
```

### 6. Client Onboarding Flow

**Automated Workflow**

```typescript
// app/api/clients/onboard/route.ts
import { AutonomousAgentPool } from '@/services/agents/agent-pool';

export async function POST(request: Request) {
  const { clientName, industry, requirements } = await request.json();

  // 1. Create client in CRM
  const client = await db.insert('companies', {
    name: clientName,
    industry: industry
  });

  // 2. Create isolated workspace
  const workspace = await db.insert('client_workspaces', {
    client_id: client.id,
    workspace_name: 'main',
    workspace_path: `D:/GEO_SEO_Domination-Tool/workspaces/${client.id}/main`,
    brand_name: clientName,
    brand_primary_color: '#10b981' // Default emerald
  });

  // 3. Queue autonomous onboarding agent (runs in background)
  const agentPool = new AutonomousAgentPool();
  const taskId = agentPool.queueTask({
    id: `onboard_${client.id}`,
    agentType: 'onboarding',
    workspaceId: workspace.id,
    clientId: client.id,
    payload: {
      requirements: requirements,
      industry: industry
    },
    priority: 'high',
    status: 'queued'
  });

  // 4. Return immediately (agent works in background)
  return Response.json({
    success: true,
    client_id: client.id,
    workspace_id: workspace.id,
    onboarding_task_id: taskId,
    message: 'Client workspace created. Setup agent running in background.'
  });
}
```

## Implementation Phases

### Phase 1: Terminal Infrastructure (Week 1)
- [ ] Install `node-pty` for Windows terminal support
- [ ] Create WebSocket API route for terminal communication
- [ ] Build `WhiteLabelTerminal` component with xterm.js
- [ ] Test Claude Code CLI integration in embedded terminal

### Phase 2: Agent Framework (Week 2)
- [ ] Build `AutonomousAgentPool` service
- [ ] Create 4 base agents (SEO, Content, GitHub, Onboarding)
- [ ] Implement tool execution system
- [ ] Add agent status dashboard

### Phase 3: Workspace Isolation (Week 3)
- [ ] Database migrations for workspaces
- [ ] File system isolation per client
- [ ] Environment variable management
- [ ] Resource limit enforcement

### Phase 4: White-Label UI (Week 4)
- [ ] Customizable branding system
- [ ] Client-facing dashboard
- [ ] Agent execution viewer
- [ ] Project file browser

### Phase 5: Integration & Testing (Week 5)
- [ ] End-to-end client onboarding flow
- [ ] Multi-agent orchestration tests
- [ ] Performance optimization
- [ ] Security audit

## Windows-Specific Considerations

### 1. Path Handling
```typescript
import * as path from 'path';

// Always use path.win32 for Windows paths
const workspacePath = path.win32.join('D:', 'GEO_SEO_Domination-Tool', 'workspaces', clientId);
```

### 2. PowerShell Integration
```typescript
// Use PowerShell for advanced scripting
const psScript = `
  Set-Location "${workspacePath}"
  git init
  Write-Host "Workspace initialized"
`;

execSync(`powershell -Command "${psScript}"`);
```

### 3. File Permissions
```typescript
import { execSync } from 'child_process';

// Set directory permissions (Windows ACL)
execSync(`icacls "${workspacePath}" /grant Users:F /T`);
```

## Security & Isolation

### 1. Process Sandboxing
- Each client workspace runs in separate Node.js child process
- Limited file system access (only workspace directory)
- Network restrictions via Windows Firewall rules

### 2. API Key Management
```typescript
// Store per-client API keys encrypted
const clientApiKeys = await getEncryptedApiKeys(clientId);

process.env.ANTHROPIC_API_KEY = clientApiKeys.anthropic;
```

### 3. Resource Limits
```typescript
// Limit agent execution time and memory
const agentProcess = spawn('node', ['agent.js'], {
  timeout: 5 * 60 * 1000, // 5 minutes
  maxBuffer: 10 * 1024 * 1024, // 10MB
});
```

## Benefits of This Architecture

1. **For You**:
   - One tool for all your businesses
   - Autonomous agents handle routine tasks
   - Complete project history in CRM
   - White-labeled for your brand

2. **For Clients**:
   - See AI work in real-time
   - Isolated, secure workspace
   - Direct access to project files
   - Transparent development process

3. **For Your Business**:
   - Scale to unlimited clients
   - Reusable agent templates
   - Automated onboarding
   - Premium SaaS offering

## Next Steps

1. Review this architecture
2. Decide which agents to build first
3. Choose which phase to start with
4. Set up development environment
5. Begin implementation

Would you like me to start building any specific component?
