/**
 * Workspace Context Provider
 *
 * Phase 1.1 Day 5-7: The integration layer that makes all tools context-aware
 *
 * This is the critical piece that transforms fragmented tools into a unified IDE.
 * All components consume this context to share state.
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { WorkspaceState, WorkspaceContext as WsContext, OpenFile, Client, Project, TerminalSession, AgentInstance } from './types';
import { createDefaultWorkspace } from './constants';

interface WorkspaceProviderProps {
  children: ReactNode;
  initialWorkspace?: WorkspaceState;
}

interface WorkspaceContextValue {
  // Current workspace state
  workspace: WorkspaceState;
  context: WsContext;
  openFiles: OpenFile[];
  activeFile: OpenFile | null;
  terminals: TerminalSession[];
  agents: AgentInstance[];

  // Context actions
  setClient: (client: Client | null) => void;
  setProject: (project: Project | null) => void;

  // File actions
  openFile: (file: OpenFile) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (file: OpenFile) => void;
  updateFile: (fileId: string, content: string) => void;
  saveFile: (fileId: string) => Promise<void>;

  // Terminal actions
  createTerminal: (name?: string) => TerminalSession;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;

  // Agent actions
  startAgent: (type: string, config: Record<string, any>) => Promise<AgentInstance>;
  stopAgent: (id: string) => void;

  // Workspace actions
  saveWorkspace: () => Promise<void>;
  loadWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children, initialWorkspace }: WorkspaceProviderProps) {
  const [workspace, setWorkspace] = useState<WorkspaceState>(
    initialWorkspace || createDefaultWorkspace()
  );
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFileState] = useState<OpenFile | null>(null);
  const [terminals, setTerminals] = useState<TerminalSession[]>([]);
  const [agents, setAgents] = useState<AgentInstance[]>([]);

  // ========================================================================
  // Context Actions
  // ========================================================================

  const setClient = useCallback((client: Client | null) => {
    setWorkspace(prev => ({
      ...prev,
      context: {
        ...prev.context,
        currentClient: client
      },
      updatedAt: new Date()
    }));

    // Emit event for other tools to react
    window.dispatchEvent(new CustomEvent('workspace:client-changed', {
      detail: { client }
    }));
  }, []);

  const setProject = useCallback((project: Project | null) => {
    setWorkspace(prev => ({
      ...prev,
      context: {
        ...prev.context,
        currentProject: project
      },
      updatedAt: new Date()
    }));

    window.dispatchEvent(new CustomEvent('workspace:project-changed', {
      detail: { project }
    }));
  }, []);

  // ========================================================================
  // File Actions
  // ========================================================================

  const openFile = useCallback((file: OpenFile) => {
    setOpenFiles(prev => {
      // Check if already open
      const existing = prev.find(f => f.id === file.id);
      if (existing) {
        setActiveFileState(existing);
        return prev;
      }
      return [...prev, file];
    });
    setActiveFileState(file);

    // Update workspace state
    setWorkspace(prev => ({
      ...prev,
      openFiles: [...prev.openFiles, file],
      updatedAt: new Date()
    }));
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setOpenFiles(prev => prev.filter(f => f.id !== fileId));

    if (activeFile?.id === fileId) {
      setActiveFileState(prev => {
        const remaining = openFiles.filter(f => f.id !== fileId);
        return remaining.length > 0 ? remaining[0] : null;
      });
    }

    setWorkspace(prev => ({
      ...prev,
      openFiles: prev.openFiles.filter(f => f.id !== fileId),
      updatedAt: new Date()
    }));
  }, [activeFile, openFiles]);

  const setActiveFile = useCallback((file: OpenFile) => {
    setActiveFileState(file);
  }, []);

  const updateFile = useCallback((fileId: string, content: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, content, dirty: true } : f
    ));

    if (activeFile?.id === fileId) {
      setActiveFileState(prev => prev ? { ...prev, content, dirty: true } : null);
    }
  }, [activeFile]);

  const saveFile = useCallback(async (fileId: string) => {
    const file = openFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Save to API
      const response = await fetch('/api/terminal/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: file.path,
          content: file.content
        })
      });

      if (!response.ok) throw new Error('Failed to save file');

      // Mark as clean
      setOpenFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, dirty: false } : f
      ));

      if (activeFile?.id === fileId) {
        setActiveFileState(prev => prev ? { ...prev, dirty: false } : null);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }, [openFiles, activeFile]);

  // ========================================================================
  // Terminal Actions
  // ========================================================================

  const createTerminal = useCallback((name?: string) => {
    const terminal: TerminalSession = {
      id: crypto.randomUUID(),
      name: name || `Terminal ${terminals.length + 1}`,
      cwd: '/',
      history: [],
      active: true
    };

    setTerminals(prev => [...prev, terminal]);
    return terminal;
  }, [terminals.length]);

  const closeTerminal = useCallback((id: string) => {
    setTerminals(prev => prev.filter(t => t.id !== id));
  }, []);

  const setActiveTerminal = useCallback((id: string) => {
    setTerminals(prev => prev.map(t => ({
      ...t,
      active: t.id === id
    })));
  }, []);

  // ========================================================================
  // Agent Actions
  // ========================================================================

  const startAgent = useCallback(async (type: string, config: Record<string, any>) => {
    const agent: AgentInstance = {
      id: crypto.randomUUID(),
      type,
      name: config.name || type,
      status: 'running',
      progress: 0,
      config,
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: `Starting ${type} agent...`
      }]
    };

    setAgents(prev => [...prev, agent]);

    // Call API to start agent
    try {
      await fetch('/api/agents/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config })
      });
    } catch (error) {
      console.error('Error starting agent:', error);
    }

    return agent;
  }, []);

  const stopAgent = useCallback((id: string) => {
    setAgents(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'idle' as const } : a
    ));
  }, []);

  // ========================================================================
  // Workspace Actions
  // ========================================================================

  const saveWorkspace = useCallback(async () => {
    try {
      const response = await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspace)
      });

      if (!response.ok) throw new Error('Failed to save workspace');

      console.log('Workspace saved successfully');
    } catch (error) {
      console.error('Error saving workspace:', error);
      throw error;
    }
  }, [workspace]);

  const loadWorkspace = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/workspace/load?id=${id}`);
      if (!response.ok) throw new Error('Failed to load workspace');

      const data = await response.json();
      setWorkspace(data.workspace);
      setOpenFiles(data.workspace.openFiles || []);
    } catch (error) {
      console.error('Error loading workspace:', error);
      throw error;
    }
  }, []);

  // ========================================================================
  // Auto-save workspace state to localStorage
  // ========================================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('workspace:state', JSON.stringify(workspace));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [workspace]);

  // ========================================================================
  // Context Value
  // ========================================================================

  const value: WorkspaceContextValue = {
    workspace,
    context: workspace.context,
    openFiles,
    activeFile,
    terminals,
    agents,

    setClient,
    setProject,

    openFile,
    closeFile,
    setActiveFile,
    updateFile,
    saveFile,

    createTerminal,
    closeTerminal,
    setActiveTerminal,

    startAgent,
    stopAgent,

    saveWorkspace,
    loadWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ========================================================================
// Hook
// ========================================================================

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}

// ========================================================================
// Event Listeners Hook (for tools to react to workspace changes)
// ========================================================================

export function useWorkspaceEvents(
  eventType: 'client-changed' | 'project-changed' | 'file-opened' | 'file-saved',
  handler: (detail: any) => void
) {
  useEffect(() => {
    const eventHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      handler(customEvent.detail);
    };

    window.addEventListener(`workspace:${eventType}`, eventHandler);
    return () => window.removeEventListener(`workspace:${eventType}`, eventHandler);
  }, [eventType, handler]);
}
