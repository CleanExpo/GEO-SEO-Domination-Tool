# Phase 1: Unified Workspace Foundation

**Duration**: Weeks 1-2 (14 days)
**Progress**: [░░░░░░░░░░] 0%
**Impact**: +25% (from 56% → 81%)
**Priority**: 🔴 CRITICAL

---

## Objectives

1. Create unified workspace layout with resizable panels
2. Implement context-aware state management across all tools
3. Add workspace persistence (save/load state)
4. Enable quick workspace switching

---

## Phase 1.1: Core Workspace Layout (Days 1-7)

### Goal
Create VS Code-like layout that can house all existing tools in one unified interface.

### Files to Create

```
components/workspace/
├── WorkspaceProvider.tsx        # Global context provider
├── WorkspaceLayout.tsx          # Main layout with resizable panels
├── UnifiedSidebar.tsx           # Left sidebar (files + clients + agents)
├── MainPanel.tsx                # Center panel (editor/dashboard)
├── RightPanel.tsx               # Right panel (terminal + AI)
├── BottomPanel.tsx              # Bottom panel (tasks + output)
└── PanelContainer.tsx           # Reusable panel wrapper

lib/workspace/
├── types.ts                     # TypeScript definitions
├── constants.ts                 # Default layouts and config
├── utils.ts                     # Helper functions
└── hooks/
    ├── useWorkspace.ts          # Main workspace hook
    ├── usePanel.ts              # Panel state management
    └── useLayout.ts             # Layout helpers

app/workspace/
├── layout.tsx                   # Workspace route wrapper
└── page.tsx                     # Default workspace view
```

### Implementation Steps

#### Day 1-2: Layout Foundation

**Step 1.1**: Install dependencies
```bash
npm install react-resizable-panels
npm install @radix-ui/react-slot
npm install class-variance-authority
```

**Step 1.2**: Create workspace types
```typescript
// lib/workspace/types.ts
export interface WorkspaceState {
  id: string;
  name: string;
  layout: PanelLayout;
  context: WorkspaceContext;
  openFiles: OpenFile[];
  activeView: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PanelLayout {
  sidebar: { collapsed: boolean; width: number };
  main: { activeTab: string };
  right: { collapsed: boolean; width: number };
  bottom: { collapsed: boolean; height: number };
}

export interface WorkspaceContext {
  currentClient: Client | null;
  currentProject: Project | null;
  currentOrganisation: Organisation;
  filters: Record<string, any>;
  env: Record<string, string>;
}

export interface OpenFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  dirty: boolean;
}
```

**Step 1.3**: Create workspace layout component
```typescript
// components/workspace/WorkspaceLayout.tsx
'use client';

import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { UnifiedSidebar } from './UnifiedSidebar';
import { MainPanel } from './MainPanel';
import { RightPanel } from './RightPanel';
import { BottomPanel } from './BottomPanel';

export function WorkspaceLayout() {
  return (
    <div className="h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="h-12 border-b bg-background">
        <WorkspaceNav />
      </div>

      {/* Main workspace area */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left sidebar */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <UnifiedSidebar />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary" />

          {/* Center + Right area */}
          <Panel defaultSize={80}>
            <PanelGroup direction="horizontal">
              {/* Main editor/dashboard */}
              <Panel defaultSize={70} minSize={40}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    <MainPanel />
                  </Panel>

                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary" />

                  {/* Bottom panel */}
                  <Panel defaultSize={30} minSize={20} maxSize={50}>
                    <BottomPanel />
                  </Panel>
                </PanelGroup>
              </Panel>

              <PanelResizeHandle className="w-1 bg-border hover:bg-primary" />

              {/* Right panel (Terminal/AI) */}
              <Panel defaultSize={30} minSize={20} maxSize={40}>
                <RightPanel />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
```

**Checkpoint Day 2**: Layout renders with resizable panels ✅

---

#### Day 3-4: Panel Components

**Step 1.4**: Create UnifiedSidebar
```typescript
// components/workspace/UnifiedSidebar.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Files, Users, Bot, GitBranch } from 'lucide-react';
import { FileExplorer } from '@/components/terminal/FileBrowser';
import { ClientList } from './ClientList';
import { AgentPanel } from './AgentPanel';

export function UnifiedSidebar() {
  return (
    <div className="h-full flex flex-col bg-muted/30">
      <Tabs defaultValue="files" className="h-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="files">
            <Files className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="git">
            <GitBranch className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 overflow-auto">
          <FileExplorer />
        </TabsContent>

        <TabsContent value="clients" className="flex-1 overflow-auto">
          <ClientList />
        </TabsContent>

        <TabsContent value="agents" className="flex-1 overflow-auto">
          <AgentPanel />
        </TabsContent>

        <TabsContent value="git" className="flex-1 overflow-auto">
          {/* Git panel - Phase 2 */}
          <div className="p-4 text-muted-foreground">
            Git integration coming in Phase 2
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 1.5**: Create MainPanel with tab system
```typescript
// components/workspace/MainPanel.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/useWorkspace';
import { CodeEditor } from '@/components/terminal/CodeEditor';
import { Button } from '@/components/ui/button';

export function MainPanel() {
  const { openFiles, activeFile, setActiveFile, closeFile } = useWorkspace();

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No files open</p>
          <p className="text-sm">Open a file from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeFile?.id} onValueChange={(id) => {
      const file = openFiles.find(f => f.id === id);
      if (file) setActiveFile(file);
    }}>
      <div className="flex items-center border-b bg-muted/20">
        <TabsList className="h-10">
          {openFiles.map((file) => (
            <TabsTrigger key={file.id} value={file.id} className="group">
              <span>{file.name}</span>
              {file.dirty && <span className="ml-1 text-orange-500">●</span>}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {openFiles.map((file) => (
        <TabsContent key={file.id} value={file.id} className="h-[calc(100%-2.5rem)]">
          <CodeEditor
            file={file}
            onChange={(content) => {
              // Handle file changes
            }}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

**Checkpoint Day 4**: All panels render with placeholder content ✅

---

#### Day 5-7: Context Provider

**Step 1.6**: Create workspace context
```typescript
// lib/workspace/WorkspaceContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WorkspaceState, WorkspaceContext as WsContext, OpenFile } from './types';

interface WorkspaceProviderProps {
  children: React.ReactNode;
  initialWorkspace?: WorkspaceState;
}

const WorkspaceContext = createContext<{
  workspace: WorkspaceState;
  context: WsContext;
  openFiles: OpenFile[];
  activeFile: OpenFile | null;

  // Context actions
  setClient: (client: Client | null) => void;
  setProject: (project: Project | null) => void;

  // File actions
  openFile: (file: OpenFile) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (file: OpenFile) => void;
  updateFile: (fileId: string, content: string) => void;

  // Workspace actions
  saveWorkspace: () => Promise<void>;
  loadWorkspace: (id: string) => Promise<void>;
} | undefined>(undefined);

export function WorkspaceProvider({ children, initialWorkspace }: WorkspaceProviderProps) {
  const [workspace, setWorkspace] = useState<WorkspaceState>(
    initialWorkspace || createDefaultWorkspace()
  );
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<OpenFile | null>(null);

  const setClient = useCallback((client: Client | null) => {
    setWorkspace(prev => ({
      ...prev,
      context: { ...prev.context, currentClient: client }
    }));
  }, []);

  const openFile = useCallback((file: OpenFile) => {
    setOpenFiles(prev => {
      if (prev.find(f => f.id === file.id)) return prev;
      return [...prev, file];
    });
    setActiveFile(file);
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFile?.id === fileId) {
      setActiveFile(null);
    }
  }, [activeFile]);

  // Auto-save workspace state
  useEffect(() => {
    const timer = setTimeout(() => {
      saveWorkspaceToLocal(workspace);
    }, 1000);
    return () => clearTimeout(timer);
  }, [workspace]);

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      context: workspace.context,
      openFiles,
      activeFile,
      setClient,
      setProject: (project) => {/* implement */},
      openFile,
      closeFile,
      setActiveFile,
      updateFile: (fileId, content) => {/* implement */},
      saveWorkspace: async () => {/* implement */},
      loadWorkspace: async (id) => {/* implement */}
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
```

**Checkpoint Day 7**: Workspace context working, state persists ✅

---

## Phase 1.2: Workspace Persistence (Days 8-14)

### Goal
Save and restore workspace state across sessions.

### Implementation Steps

#### Day 8-9: API Endpoints

**Step 1.7**: Create workspace save API
```typescript
// app/api/workspace/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await request.json();
    const db = getDatabase();

    // Save to database
    await db.query(
      `INSERT INTO workspaces (id, user_id, name, state, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         state = excluded.state,
         updated_at = excluded.updated_at`,
      [
        workspace.id,
        user.id,
        workspace.name,
        JSON.stringify(workspace),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Checkpoint Day 9**: Workspace saving to database ✅

---

#### Day 10-11: Client List Integration

**Step 1.8**: Create context-aware client list
```typescript
// components/workspace/ClientList.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWorkspace } from '@/lib/workspace/useWorkspace';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building, ChevronRight } from 'lucide-react';

export function ClientList() {
  const { context, setClient } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => setClients(data.companies || []));
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <h3 className="px-2 mb-2 text-sm font-semibold">Clients</h3>
        <div className="space-y-1">
          {clients.map((client) => (
            <Button
              key={client.id}
              variant={context.currentClient?.id === client.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setClient(client)}
            >
              <Building className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">{client.name}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
```

**Checkpoint Day 11**: Client switching updates workspace context ✅

---

#### Day 12-14: Testing & Refinement

**Step 1.9**: Create workspace tests
```typescript
// __tests__/workspace/context.test.ts
import { renderHook, act } from '@testing-library/react';
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace/WorkspaceContext';

describe('WorkspaceContext', () => {
  it('should open and close files', () => {
    const wrapper = ({ children }) => <WorkspaceProvider>{children}</WorkspaceProvider>;
    const { result } = renderHook(() => useWorkspace(), { wrapper });

    act(() => {
      result.current.openFile({
        id: '1',
        name: 'test.ts',
        path: '/test.ts',
        content: '',
        language: 'typescript',
        dirty: false
      });
    });

    expect(result.current.openFiles).toHaveLength(1);

    act(() => {
      result.current.closeFile('1');
    });

    expect(result.current.openFiles).toHaveLength(0);
  });

  it('should update context when client changes', () => {
    const wrapper = ({ children }) => <WorkspaceProvider>{children}</WorkspaceProvider>;
    const { result } = renderHook(() => useWorkspace(), { wrapper });

    const client = { id: '1', name: 'Test Client' };

    act(() => {
      result.current.setClient(client);
    });

    expect(result.current.context.currentClient).toEqual(client);
  });
});
```

**Checkpoint Day 14**: All Phase 1 tests passing ✅

---

## Success Criteria

Phase 1 is complete when:

- [ ] Unified workspace layout renders
- [ ] All panels are resizable
- [ ] Sidebar contains files + clients + agents tabs
- [ ] Main panel shows open files with tabs
- [ ] Right panel shows terminal/AI placeholder
- [ ] Bottom panel shows tasks/output placeholder
- [ ] Workspace context is shared across all components
- [ ] Client switching updates all context-aware tools
- [ ] Workspace state persists to database
- [ ] Workspace state restores on page load
- [ ] All Phase 1 tests passing (95%+ coverage)

---

## Expected Outcomes

### Metrics
- Overall completion: 56% → 81% (+25%)
- Test pass rate: 56% → 70%
- Tool integration: 20% → 60%

### User Experience
- Single unified workspace (no more page switching)
- Client context preserved across tools
- Workspace state persists between sessions
- Professional IDE-like feel

---

## Next Steps

After completing Phase 1:
1. Review and demo to stakeholders
2. Gather feedback on layout and UX
3. Proceed to [Phase 2: IDE Features](./phase-2-ide-features.md)

---

**Status**: Ready to begin
**Start Date**: TBD
**Estimated Completion**: 2 weeks from start
