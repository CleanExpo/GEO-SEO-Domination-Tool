'use client';

/**
 * White-Label Terminal Page
 * Embedded terminal with xterm.js for Windows PowerShell
 */

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Terminal as TerminalIcon, X } from 'lucide-react';

interface TerminalProps {
  workspaceId?: string;
  clientId?: string;
  brandName?: string;
  brandColor?: string;
}

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal>();
  const fitAddon = useRef<FitAddon>();
  const [sessionId, setSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pollingInterval = useRef<NodeJS.Timeout>();

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    terminal.current = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
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
        brightWhite: '#e5e5e5',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
    });

    // Add addons
    fitAddon.current = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(webLinksAddon);

    // Open terminal
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Handle terminal input
    terminal.current.onData((data) => {
      if (sessionId) {
        sendCommand(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.current?.dispose();
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Create terminal session
  const createSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'default',
          clientId: 'owner',
          shell: 'powershell',
          brandName: 'GEO-SEO AI Terminal'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setIsConnected(true);

        terminal.current?.writeln('\x1b[1;32m✓ Terminal session created\x1b[0m');
        terminal.current?.writeln(`Session ID: ${data.sessionId}`);
        terminal.current?.writeln(`Workspace: ${data.session.cwd}`);
        terminal.current?.writeln('');
        terminal.current?.write('PS> ');

        // Start polling for output (simple approach)
        startOutputPolling(data.sessionId);
      } else {
        terminal.current?.writeln('\x1b[1;31m✗ Failed to create session\x1b[0m');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      terminal.current?.writeln('\x1b[1;31m✗ Connection error\x1b[0m');
    } finally {
      setIsLoading(false);
    }
  };

  // Send command to terminal
  const sendCommand = async (command: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/terminal/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      const data = await response.json();

      if (data.success && data.output) {
        terminal.current?.write(data.output);
      }
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  };

  // Poll for terminal output (simplified approach - in production use WebSockets)
  const startOutputPolling = (sid: string) => {
    // This is a simplified implementation
    // In production, implement proper output streaming
  };

  // Close session
  const closeSession = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/terminal/${sessionId}`, {
        method: 'DELETE'
      });

      setSessionId('');
      setIsConnected(false);
      terminal.current?.clear();
      terminal.current?.writeln('\x1b[1;33m✓ Session closed\x1b[0m');

      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    } catch (error) {
      console.error('Failed to close session:', error);
    }
  };

  // Run example command
  const runExampleCommand = async (cmd: string) => {
    if (!sessionId) {
      await createSession();
      // Wait for session to be ready
      setTimeout(() => {
        terminal.current?.write(`${cmd}\r`);
        sendCommand(`${cmd}\n`);
      }, 1000);
    } else {
      terminal.current?.write(`${cmd}\r`);
      sendCommand(`${cmd}\n`);
    }
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TerminalIcon className="w-6 h-6" />
          White-Label Terminal
        </h1>
        <p className="text-muted-foreground">
          Embedded Windows PowerShell for your GEO-SEO workspace
        </p>
      </div>

      {/* Controls */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={createSession}
            disabled={isConnected || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <TerminalIcon className="mr-2 h-4 w-4" />
                Start Terminal
              </>
            )}
          </Button>

          <Button
            onClick={closeSession}
            variant="destructive"
            disabled={!isConnected}
          >
            <X className="mr-2 h-4 w-4" />
            Close Session
          </Button>

          <div className="flex-1" />

          {/* Quick Commands */}
          <div className="flex gap-2">
            <Button
              onClick={() => runExampleCommand('Get-Location')}
              variant="outline"
              size="sm"
              disabled={!isConnected}
            >
              pwd
            </Button>
            <Button
              onClick={() => runExampleCommand('Get-ChildItem')}
              variant="outline"
              size="sm"
              disabled={!isConnected}
            >
              ls
            </Button>
            <Button
              onClick={() => runExampleCommand('claude --version')}
              variant="outline"
              size="sm"
              disabled={!isConnected}
            >
              Claude Version
            </Button>
          </div>
        </div>

        {/* Status */}
        {sessionId && (
          <div className="mt-2 text-sm text-muted-foreground">
            Session: {sessionId} | Status: {isConnected ? '✓ Connected' : '✗ Disconnected'}
          </div>
        )}
      </Card>

      {/* Terminal */}
      <Card className="flex-1 p-0 overflow-hidden">
        <div ref={terminalRef} className="w-full h-full" />
      </Card>
    </div>
  );
}
