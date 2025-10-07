/**
 * Terminal Management API
 * REST endpoints for terminal session management
 */

import { NextRequest } from 'next/server';
import { terminalService } from '@/services/terminal/windows-terminal-service';

/**
 * GET: List all active terminal sessions
 */
export async function GET(request: NextRequest) {
  try {
    const sessions = terminalService.getAllSessions();

    return Response.json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        workspaceId: s.workspaceId,
        clientId: s.clientId,
        cwd: s.cwd,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity
      }))
    });

  } catch (error) {
    console.error('Failed to list sessions:', error);
    return Response.json({
      error: 'Failed to list sessions',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * POST: Create new terminal session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId = 'default',
      clientId = 'owner',
      shell = 'powershell',
      brandName,
      workingDirectory
    } = body;

    const sessionId = await terminalService.createSession({
      workspaceId,
      clientId,
      shell,
      brandName,
      workingDirectory
    });

    const session = terminalService.getSession(sessionId);

    return Response.json({
      success: true,
      sessionId,
      session: {
        id: session!.id,
        workspaceId: session!.workspaceId,
        clientId: session!.clientId,
        cwd: session!.cwd,
        createdAt: session!.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create session:', error);
    return Response.json({
      error: 'Failed to create session',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * DELETE: Cleanup inactive sessions
 */
export async function DELETE(request: NextRequest) {
  try {
    const maxInactiveMinutes = parseInt(
      request.nextUrl.searchParams.get('maxInactiveMinutes') || '60'
    );

    const cleaned = terminalService.cleanupInactiveSessions(maxInactiveMinutes);

    return Response.json({
      success: true,
      cleaned,
      message: `Cleaned ${cleaned} inactive sessions`
    });

  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
    return Response.json({
      error: 'Failed to cleanup sessions',
      message: (error as Error).message
    }, { status: 500 });
  }
}
