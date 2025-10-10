/**
 * Workspace Type Definitions
 *
 * Phase 1.1 Day 1: Core workspace types for IDE ecosystem
 *
 * These types define the structure of the unified workspace,
 * enabling context-aware tools and persistent state management.
 */

// ============================================================================
// Core Workspace Types
// ============================================================================

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
  sidebar: {
    collapsed: boolean;
    width: number;
    activeTab: 'files' | 'clients' | 'agents' | 'git';
  };
  main: {
    activeTab: string | null;
  };
  right: {
    collapsed: boolean;
    width: number;
    activeTab: 'terminal' | 'ai' | 'debug';
  };
  bottom: {
    collapsed: boolean;
    height: number;
    activeTab: 'tasks' | 'problems' | 'output' | 'git';
  };
}

// ============================================================================
// Context Types (Shared across all tools)
// ============================================================================

export interface WorkspaceContext {
  currentClient: Client | null;
  currentProject: Project | null;
  currentOrganisation: Organisation;
  filters: Record<string, any>;
  env: Record<string, string>;
}

export interface Client {
  id: string;
  name: string;
  website: string;
  industry?: string;
  location?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  status: 'active' | 'completed' | 'paused';
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
}

// ============================================================================
// File Management Types
// ============================================================================

export interface OpenFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  dirty: boolean;
  cursor?: {
    line: number;
    column: number;
  };
  scrollPosition?: number;
}

export interface FileReference {
  path: string;
  name: string;
  type: 'file' | 'directory';
}

// ============================================================================
// Terminal & Agent Types
// ============================================================================

export interface TerminalSession {
  id: string;
  name: string;
  cwd: string;
  history: string[];
  active: boolean;
}

export interface AgentInstance {
  id: string;
  type: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  config: Record<string, any>;
  logs: AgentLog[];
}

export interface AgentLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

// ============================================================================
// Command Palette Types
// ============================================================================

export interface Command {
  id: string;
  title: string;
  category: string;
  icon?: string;
  shortcut?: string;
  handler: () => void | Promise<void>;
}

// ============================================================================
// Git Integration Types
// ============================================================================

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFile[];
  unstaged: GitFile[];
  untracked: GitFile[];
}

export interface GitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
}

// ============================================================================
// Panel State Types
// ============================================================================

export interface PanelState {
  id: string;
  title: string;
  icon?: string;
  visible: boolean;
  active: boolean;
  content?: React.ReactNode;
}

// ============================================================================
// Workspace Actions Interface
// ============================================================================

export interface WorkspaceActions {
  // Context actions
  setClient: (client: Client | null) => void;
  setProject: (project: Project | null) => void;
  setOrganisation: (org: Organisation) => void;

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

  // Layout actions
  togglePanel: (panel: 'sidebar' | 'right' | 'bottom') => void;
  setPanelSize: (panel: string, size: number) => void;
  setActiveTab: (panel: string, tab: string) => void;

  // Workspace actions
  saveWorkspace: () => Promise<void>;
  loadWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string) => WorkspaceState;
  deleteWorkspace: (id: string) => Promise<void>;
}

// ============================================================================
// Event Types
// ============================================================================

export type WorkspaceEvent =
  | { type: 'FILE_OPENED'; payload: OpenFile }
  | { type: 'FILE_CLOSED'; payload: { fileId: string } }
  | { type: 'FILE_SAVED'; payload: { fileId: string } }
  | { type: 'CLIENT_CHANGED'; payload: { client: Client | null } }
  | { type: 'PROJECT_CHANGED'; payload: { project: Project | null } }
  | { type: 'AGENT_STARTED'; payload: { agent: AgentInstance } }
  | { type: 'AGENT_PROGRESS'; payload: { agentId: string; progress: number } }
  | { type: 'AGENT_COMPLETED'; payload: { agentId: string } }
  | { type: 'WORKSPACE_SAVED'; payload: { workspaceId: string } }
  | { type: 'WORKSPACE_LOADED'; payload: { workspaceId: string } };

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
