'use client';

/**
 * Terminal Tabs Component
 *
 * Multi-tab terminal interface:
 * - Multiple terminal sessions
 * - Tab management (add, close, rename)
 * - Active tab indicator
 * - Tab context menu
 * - Keyboard shortcuts (Ctrl+T, Ctrl+W)
 */

import { useState, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import {
  Plus,
  X,
  Terminal as TerminalIcon,
  MoreVertical,
  Copy,
  Trash2,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import '@xterm/xterm/css/xterm.css';

interface TerminalSession {
  id: string;
  sessionId: string;
  name: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  container: HTMLDivElement | null;
  shell: 'powershell' | 'cmd' | 'bash';
  cwd?: string;
}

interface TerminalTabsProps {
  workspaceId: string;
  clientId: string;
  brandName?: string;
}

export function TerminalTabs({
  workspaceId,
  clientId,
  brandName = 'AI Terminal'
}: TerminalTabsProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create initial terminal session
    if (sessions.length === 0) {
      handleAddTerminal();
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: New terminal
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && !e.shiftKey) {
        e.preventDefault();
        handleAddTerminal();
      }

      // Ctrl+W: Close terminal
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeSessionId) {
          handleCloseTerminal(activeSessionId);
        }
      }

      // Ctrl+Tab: Next terminal
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        const activeIndex = sessions.findIndex(s => s.id === activeSessionId);
        const nextIndex = (activeIndex + 1) % sessions.length;
        if (sessions[nextIndex]) {
          setActiveSessionId(sessions[nextIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessions, activeSessionId]);

  useEffect(() => {
    // Resize terminals when active session changes
    if (activeSessionId) {
      const session = sessions.find(s => s.id === activeSessionId);
      if (session) {
        setTimeout(() => {
          session.fitAddon.fit();
        }, 100);
      }
    }
  }, [activeSessionId, sessions]);

  const handleAddTerminal = async (shell: 'powershell' | 'cmd' | 'bash' = 'powershell') => {
    try {
      // Create terminal session via API
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          clientId,
          shell,
          brandName
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create terminal session');
      }

      // Create xterm.js terminal instance
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          cursorAccent: '#000000',
          selectionBackground: '#264f78',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#ffffff'
        }
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      // Create new session
      const newSession: TerminalSession = {
        id: `term_${Date.now()}`,
        sessionId: data.sessionId,
        name: `Terminal ${sessions.length + 1}`,
        terminal,
        fitAddon,
        container: null,
        shell
      };

      // Handle terminal input
      terminal.onData((data) => {
        handleTerminalInput(newSession.sessionId, data);
      });

      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(newSession.id);

      toast({
        title: 'Terminal created',
        description: `New ${shell} terminal session started`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCloseTerminal = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Dispose terminal
    session.terminal.dispose();

    // Remove session
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);

    // Set new active session
    if (activeSessionId === sessionId) {
      if (newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  const handleTerminalInput = async (sessionId: string, data: string) => {
    try {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          command: data
        })
      });

      const result = await response.json();

      if (result.success) {
        const session = sessions.find(s => s.sessionId === sessionId);
        if (session && result.output) {
          session.terminal.write(result.output);
        }
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  const handleRenameTab = (sessionId: string, newName: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, name: newName } : s
    ));
    setEditingTab(null);
  };

  const handleDuplicateTerminal = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      handleAddTerminal(session.shell);
    }
  };

  useEffect(() => {
    // Mount terminals to DOM
    sessions.forEach((session) => {
      if (session.container && !session.terminal.element) {
        session.terminal.open(session.container);
        session.fitAddon.fit();

        // Write welcome message
        session.terminal.writeln(`\x1b[1;36m${brandName}\x1b[0m`);
        session.terminal.writeln(`Shell: ${session.shell}`);
        session.terminal.writeln(`Workspace: ${workspaceId}`);
        session.terminal.writeln('');
      }
    });
  }, [sessions]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/30">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-background border'
                    : 'hover:bg-accent'
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <TerminalIcon className="h-4 w-4 flex-shrink-0" />

                {editingTab === session.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameTab(session.id, editingName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameTab(session.id, editingName);
                      } else if (e.key === 'Escape') {
                        setEditingTab(null);
                      }
                    }}
                    className="h-6 px-2 text-xs w-32"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm whitespace-nowrap">{session.name}</span>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingTab(session.id);
                          setEditingName(session.name);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTerminal(session.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleCloseTerminal(session.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Close
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTerminal(session.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddTerminal()}
          title="New Terminal (Ctrl+T)"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 relative bg-[#1e1e1e]" ref={terminalContainerRef}>
        {sessions.map((session) => (
          <div
            key={session.id}
            ref={(el) => {
              if (el && !session.container) {
                session.container = el;
              }
            }}
            className={`absolute inset-0 ${
              activeSessionId === session.id ? 'block' : 'hidden'
            }`}
          />
        ))}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <TerminalIcon className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No terminal sessions</p>
            <Button onClick={() => handleAddTerminal()}>
              <Plus className="h-4 w-4 mr-2" />
              New Terminal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
