/**
 * WebSocket Terminal API Route
 * Handles real-time terminal communication via WebSocket
 */

import { NextRequest } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { terminalService } from '@/services/terminal/windows-terminal-service';

// Store WebSocket connections per session
const connections = new Map<string, WebSocket>();

// Create WebSocket server (only once)
let wss: WebSocketServer | null = null;

function getWebSocketServer(): WebSocketServer {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws: WebSocket, request: any) => {
      const sessionId = request.sessionId;

      // Store connection
      connections.set(sessionId, ws);

      // Listen for terminal output
      const dataHandler = ({ sessionId: sid, data }: { sessionId: string; data: string }) => {
        if (sid === sessionId && ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      };

      const errorDataHandler = ({ sessionId: sid, data }: { sessionId: string; data: string }) => {
        if (sid === sessionId && ws.readyState === WebSocket.OPEN) {
          ws.send(`\x1b[31m${data}\x1b[0m`); // Red color for errors
        }
      };

      terminalService.on('data', dataHandler);
      terminalService.on('error-data', errorDataHandler);

      // Handle client messages (commands)
      ws.on('message', (message: Buffer) => {
        const data = message.toString('utf-8');
        terminalService.writeToTerminal(sessionId, data);
      });

      // Cleanup on close
      ws.on('close', () => {
        connections.delete(sessionId);
        terminalService.off('data', dataHandler);
        terminalService.off('error-data', errorDataHandler);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        connections.delete(sessionId);
      });
    });
  }

  return wss;
}

/**
 * GET: Create new terminal session and upgrade to WebSocket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 });
  }

  try {
    // Get or create terminal session
    let session = terminalService.getSession(sessionId);

    if (!session) {
      // Create new session
      const workspaceId = request.nextUrl.searchParams.get('workspaceId') || 'default';
      const clientId = request.nextUrl.searchParams.get('clientId') || 'owner';
      const brandName = request.nextUrl.searchParams.get('brandName') || undefined;

      const newSessionId = await terminalService.createSession({
        workspaceId,
        clientId,
        shell: 'powershell',
        brandName
      });

      session = terminalService.getSession(newSessionId);
    }

    if (!session) {
      return new Response('Failed to create terminal session', { status: 500 });
    }

    // Upgrade to WebSocket
    const wss = getWebSocketServer();

    // This is handled by Next.js server
    // In production, use a custom server or Vercel's WebSocket support
    return new Response('WebSocket upgrade initiated', {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      }
    });

  } catch (error) {
    console.error('Terminal session error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * POST: Send command to existing terminal session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const { command } = await request.json();

    if (!command) {
      return Response.json({ error: 'Command required' }, { status: 400 });
    }

    const output = await terminalService.executeCommand(sessionId, command);

    return Response.json({
      success: true,
      sessionId,
      output
    });

  } catch (error) {
    console.error('Command execution error:', error);
    return Response.json({
      error: 'Command execution failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * DELETE: Close terminal session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const success = terminalService.closeSession(sessionId);

    return Response.json({
      success,
      message: success ? 'Session closed' : 'Session not found'
    });

  } catch (error) {
    console.error('Session close error:', error);
    return Response.json({
      error: 'Failed to close session',
      message: (error as Error).message
    }, { status: 500 });
  }
}
