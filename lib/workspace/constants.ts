/**
 * Workspace Constants
 *
 * Phase 1.1 Day 1: Default configurations and layouts
 */

import { PanelLayout, WorkspaceState } from './types';

// ============================================================================
// Default Panel Sizes
// ============================================================================

export const DEFAULT_PANEL_SIZES = {
  sidebar: {
    collapsed: false,
    width: 20, // Percentage
    minWidth: 15,
    maxWidth: 30,
  },
  right: {
    collapsed: false,
    width: 30, // Percentage
    minWidth: 20,
    maxWidth: 40,
  },
  bottom: {
    collapsed: false,
    height: 30, // Percentage
    minHeight: 20,
    maxHeight: 50,
  },
} as const;

// ============================================================================
// Default Panel Layout
// ============================================================================

export const DEFAULT_LAYOUT: PanelLayout = {
  sidebar: {
    collapsed: false,
    width: DEFAULT_PANEL_SIZES.sidebar.width,
    activeTab: 'files',
  },
  main: {
    activeTab: null,
  },
  right: {
    collapsed: false,
    width: DEFAULT_PANEL_SIZES.right.width,
    activeTab: 'terminal',
  },
  bottom: {
    collapsed: true, // Start collapsed
    height: DEFAULT_PANEL_SIZES.bottom.height,
    activeTab: 'tasks',
  },
};

// ============================================================================
// Workspace Templates
// ============================================================================

export const WORKSPACE_TEMPLATES = {
  default: {
    name: 'Default Workspace',
    layout: DEFAULT_LAYOUT,
    description: 'Standard workspace layout',
  },
  clientFocused: {
    name: 'Client-Focused',
    layout: {
      ...DEFAULT_LAYOUT,
      sidebar: { ...DEFAULT_LAYOUT.sidebar, activeTab: 'clients' as const },
      right: { ...DEFAULT_LAYOUT.right, collapsed: true },
      bottom: { ...DEFAULT_LAYOUT.bottom, collapsed: false },
    },
    description: 'Optimized for client work',
  },
  codingFocused: {
    name: 'Coding-Focused',
    layout: {
      ...DEFAULT_LAYOUT,
      sidebar: { ...DEFAULT_LAYOUT.sidebar, width: 15 },
      right: { ...DEFAULT_LAYOUT.right, width: 35 },
      bottom: { ...DEFAULT_LAYOUT.bottom, collapsed: false, activeTab: 'output' as const },
    },
    description: 'Maximized editor and terminal space',
  },
  agentFocused: {
    name: 'Agent-Focused',
    layout: {
      ...DEFAULT_LAYOUT,
      sidebar: { ...DEFAULT_LAYOUT.sidebar, activeTab: 'agents' as const },
      right: { ...DEFAULT_LAYOUT.right, activeTab: 'ai' as const },
      bottom: { ...DEFAULT_LAYOUT.bottom, collapsed: false, activeTab: 'output' as const },
    },
    description: 'Monitor and control autonomous agents',
  },
} as const;

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  // Panel toggles
  toggleSidebar: 'Cmd+B',
  toggleRightPanel: 'Cmd+J',
  toggleBottomPanel: 'Cmd+\'',

  // Navigation
  commandPalette: 'Cmd+K',
  quickOpen: 'Cmd+P',
  globalSearch: 'Cmd+Shift+F',
  goToFile: 'Cmd+T',

  // File operations
  newFile: 'Cmd+N',
  saveFile: 'Cmd+S',
  saveAll: 'Cmd+Alt+S',
  closeFile: 'Cmd+W',
  closeAll: 'Cmd+K W',

  // Terminal
  newTerminal: 'Ctrl+Shift+`',
  toggleTerminal: 'Ctrl+`',

  // Git
  gitCommit: 'Cmd+Enter',
  gitStage: 'Cmd+K Cmd+S',

  // Agent
  runAgent: 'Cmd+Shift+A',
  stopAgent: 'Cmd+Shift+X',

  // Workspace
  saveWorkspace: 'Cmd+K Cmd+W',
  switchWorkspace: 'Cmd+K Cmd+O',
} as const;

// ============================================================================
// File Language Mappings
// ============================================================================

export const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.js': 'javascript',
  '.jsx': 'javascriptreact',
  '.json': 'json',
  '.md': 'markdown',
  '.css': 'css',
  '.scss': 'scss',
  '.html': 'html',
  '.py': 'python',
  '.sql': 'sql',
  '.sh': 'shell',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.xml': 'xml',
  '.svg': 'xml',
  '.env': 'dotenv',
};

// ============================================================================
// Agent Types
// ============================================================================

export const AGENT_TYPES = {
  COMPETITIVE_INTELLIGENCE: 'competitive-intelligence',
  CONTENT_GENERATOR: 'content-generator',
  SEO_OPTIMIZER: 'seo-optimizer',
  KEYWORD_RESEARCHER: 'keyword-researcher',
  BACKLINK_ANALYZER: 'backlink-analyzer',
  RANK_TRACKER: 'rank-tracker',
} as const;

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  WORKSPACE_STATE: 'workspace:state',
  RECENT_WORKSPACES: 'workspace:recent',
  USER_PREFERENCES: 'workspace:preferences',
  LAYOUT_STATE: 'workspace:layout',
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

export const API_ENDPOINTS = {
  WORKSPACE_SAVE: '/api/workspace/save',
  WORKSPACE_LOAD: '/api/workspace/load',
  WORKSPACE_LIST: '/api/workspace/list',
  WORKSPACE_DELETE: '/api/workspace/delete',

  FILE_READ: '/api/terminal/files/content',
  FILE_WRITE: '/api/terminal/files/write',
  FILE_LIST: '/api/terminal/files',

  AGENT_START: '/api/agents/start',
  AGENT_STOP: '/api/agents/stop',
  AGENT_STATUS: '/api/agents/status',
  AGENT_LOGS: '/api/agents/logs',
} as const;

// ============================================================================
// WebSocket Events
// ============================================================================

export const WS_EVENTS = {
  AGENT_PROGRESS: 'agent:progress',
  AGENT_COMPLETE: 'agent:complete',
  AGENT_ERROR: 'agent:error',
  FILE_CHANGED: 'file:changed',
  TERMINAL_OUTPUT: 'terminal:output',
} as const;

// ============================================================================
// Default Workspace Factory
// ============================================================================

export function createDefaultWorkspace(name: string = 'Default Workspace'): WorkspaceState {
  return {
    id: crypto.randomUUID(),
    name,
    layout: DEFAULT_LAYOUT,
    context: {
      currentClient: null,
      currentProject: null,
      currentOrganisation: {
        id: 'dev-org',
        name: 'Development Organisation',
        slug: 'dev-org',
        plan: 'enterprise',
      },
      filters: {},
      env: {},
    },
    openFiles: [],
    activeView: 'dashboard',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getLanguageFromPath(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'));
  return LANGUAGE_MAP[ext] || 'plaintext';
}

export function isModifierKey(key: string): boolean {
  return ['Cmd', 'Ctrl', 'Alt', 'Shift', 'Meta'].includes(key);
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  if (event.key !== key) return false;

  const hasCmd = modifiers.includes('Cmd') || modifiers.includes('Ctrl');
  const hasAlt = modifiers.includes('Alt');
  const hasShift = modifiers.includes('Shift');

  return (
    (!hasCmd || event.metaKey || event.ctrlKey) &&
    (!hasAlt || event.altKey) &&
    (!hasShift || event.shiftKey)
  );
}
