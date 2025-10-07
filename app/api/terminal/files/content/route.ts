/**
 * Terminal File Content API
 *
 * GET: Read file content
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_WORKSPACE_PATH = 'D:/GEO_SEO_Domination-Tool/workspaces';

/**
 * GET /api/terminal/files/content
 * Read file content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const clientId = searchParams.get('clientId');
    const filePath = searchParams.get('path');

    if (!workspaceId || !clientId || !filePath) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const workspacePath = path.join(BASE_WORKSPACE_PATH, clientId, workspaceId);
    const fullPath = path.join(workspacePath, filePath);

    // Security: Prevent path traversal
    if (!fullPath.startsWith(workspacePath)) {
      return Response.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return Response.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if it's a file (not a directory)
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return Response.json(
        { error: 'Path is not a file' },
        { status: 400 }
      );
    }

    // Read file content
    const content = fs.readFileSync(fullPath, 'utf8');

    return Response.json({
      success: true,
      content,
      path: filePath,
      size: stat.size,
      modified: stat.mtime.toISOString()
    });
  } catch (error: any) {
    console.error('Error reading file:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
