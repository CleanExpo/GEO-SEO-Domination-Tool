/**
 * Windows Terminal Service
 * Pure Node.js implementation without native dependencies
 * Uses child_process.spawn for Windows PowerShell/CMD integration
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

export interface TerminalSession {
  id: string;
  workspaceId: string;
  clientId: string;
  process: ChildProcess;
  cwd: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface TerminalOptions {
  workspaceId: string;
  clientId: string;
  shell?: 'powershell' | 'cmd' | 'pwsh';
  workingDirectory?: string;
  env?: Record<string, string>;
  brandName?: string;
}

export class WindowsTerminalService extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private readonly baseWorkspacePath = 'D:/GEO_SEO_Domination-Tool/workspaces';

  /**
   * Create a new terminal session
   */
  async createSession(options: TerminalOptions): Promise<string> {
    const sessionId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure workspace directory exists
    const workspacePath = options.workingDirectory ||
      path.join(this.baseWorkspacePath, options.clientId, options.workspaceId);

    await this.ensureDirectory(workspacePath);

    // Determine shell (PowerShell Core preferred, fallback to Windows PowerShell)
    const shell = this.getShellCommand(options.shell);

    // Prepare environment variables
    const env = {
      ...process.env,
      CLAUDE_WORKSPACE: options.workspaceId,
      CLIENT_ID: options.clientId,
      WORKSPACE_PATH: workspacePath,
      BRAND_NAME: options.brandName || 'GEO-SEO AI Terminal',
      // Force UTF-8 encoding for PowerShell
      PYTHONIOENCODING: 'utf-8',
      ...options.env
    };

    // Spawn shell process
    const childProcess = spawn(shell.command, shell.args, {
      cwd: workspacePath,
      env: env,
      // Use 'pipe' for stdin/stdout/stderr to capture all output
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true
    });

    // Create session
    const session: TerminalSession = {
      id: sessionId,
      workspaceId: options.workspaceId,
      clientId: options.clientId,
      process: childProcess,
      cwd: workspacePath,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);

    // Handle process events
    this.setupProcessHandlers(session);

    // Send welcome message
    this.sendWelcomeMessage(session, options.brandName);

    return sessionId;
  }

  /**
   * Write command to terminal
   */
  writeToTerminal(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process.stdin) {
      return false;
    }

    session.lastActivity = new Date();

    // Write to stdin
    return session.process.stdin.write(data);
  }

  /**
   * Execute command and return output
   */
  async executeCommand(sessionId: string, command: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      const stdoutHandler = (data: Buffer) => {
        output += data.toString('utf-8');
      };

      const stderrHandler = (data: Buffer) => {
        errorOutput += data.toString('utf-8');
      };

      // Listen for output
      session.process.stdout?.on('data', stdoutHandler);
      session.process.stderr?.on('data', stderrHandler);

      // Write command
      session.process.stdin?.write(`${command}\n`);

      // Wait for command completion (simplified - in production use prompt detection)
      setTimeout(() => {
        session.process.stdout?.off('data', stdoutHandler);
        session.process.stderr?.off('data', stderrHandler);

        if (errorOutput) {
          reject(new Error(errorOutput));
        } else {
          resolve(output);
        }
      }, 2000);
    });
  }

  /**
   * Get terminal output stream
   */
  getOutputStream(sessionId: string): NodeJS.ReadableStream | null {
    const session = this.sessions.get(sessionId);
    return session?.process.stdout || null;
  }

  /**
   * Get terminal error stream
   */
  getErrorStream(sessionId: string): NodeJS.ReadableStream | null {
    const session = this.sessions.get(sessionId);
    return session?.process.stderr || null;
  }

  /**
   * Resize terminal (no-op for basic implementation)
   */
  resize(sessionId: string, cols: number, rows: number): void {
    // Terminal resizing requires native pty
    // This is a placeholder for future enhancement
    const session = this.sessions.get(sessionId);
    if (session) {
      this.emit('resize', { sessionId, cols, rows });
    }
  }

  /**
   * Close terminal session
   */
  closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Kill process
    session.process.kill('SIGTERM');

    // Remove from sessions
    this.sessions.delete(sessionId);

    this.emit('session-closed', { sessionId });
    return true;
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all active sessions
   */
  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Cleanup inactive sessions (older than 1 hour)
   */
  cleanupInactiveSessions(maxInactiveMinutes: number = 60): number {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveMinutes = (now.getTime() - session.lastActivity.getTime()) / 1000 / 60;

      if (inactiveMinutes > maxInactiveMinutes) {
        this.closeSession(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get shell command based on preference
   */
  private getShellCommand(shell?: 'powershell' | 'cmd' | 'pwsh'): { command: string; args: string[] } {
    switch (shell) {
      case 'pwsh':
        // PowerShell Core (modern)
        return {
          command: 'pwsh.exe',
          args: ['-NoLogo', '-NoProfile']
        };
      case 'cmd':
        // Command Prompt
        return {
          command: 'cmd.exe',
          args: ['/Q']
        };
      case 'powershell':
      default:
        // Windows PowerShell (built-in)
        return {
          command: 'powershell.exe',
          args: ['-NoLogo', '-NoProfile', '-Command', '-']
        };
    }
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(session: TerminalSession): void {
    const { id, process: proc } = session;

    proc.on('exit', (code, signal) => {
      this.emit('session-exit', { sessionId: id, code, signal });
      this.sessions.delete(id);
    });

    proc.on('error', (error) => {
      this.emit('session-error', { sessionId: id, error });
      this.sessions.delete(id);
    });

    // Forward stdout
    proc.stdout?.on('data', (data: Buffer) => {
      this.emit('data', { sessionId: id, data: data.toString('utf-8') });
    });

    // Forward stderr
    proc.stderr?.on('data', (data: Buffer) => {
      this.emit('error-data', { sessionId: id, data: data.toString('utf-8') });
    });
  }

  /**
   * Send welcome message to terminal
   */
  private sendWelcomeMessage(session: TerminalSession, brandName?: string): void {
    const welcome = `
# ${brandName || 'GEO-SEO AI Terminal'}
# Workspace: ${session.workspaceId}
# Path: ${session.cwd}
#
# Type 'claude help' to get started with Claude Code
# Type 'help' for PowerShell commands
#
`;

    session.process.stdin?.write(`Write-Host "${welcome.replace(/\n/g, '`n')}" -ForegroundColor Green\n`);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

// Export singleton instance
export const terminalService = new WindowsTerminalService();
