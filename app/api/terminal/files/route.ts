/**
 * Terminal File Operations API
 *
 * GET: List files in workspace
 * PUT: Save file content
 * POST: Create new file/directory
 * DELETE: Delete file/directory
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_WORKSPACE_PATH = 'D:/GEO_SEO_Domination-Tool/workspaces';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

/**
 * GET /api/terminal/files
 * List files in workspace directory
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'default';
    const clientId = searchParams.get('clientId') || 'owner';
    const targetPath = searchParams.get('path') || '/';

    const workspacePath = path.join(BASE_WORKSPACE_PATH, clientId, workspaceId);

    // Ensure workspace directory exists
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    const fullPath = path.join(workspacePath, targetPath);

    // Security: Prevent path traversal
    if (!fullPath.startsWith(workspacePath)) {
      return Response.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }

    // Read directory tree
    const files = buildFileTree(fullPath, workspacePath);

    return Response.json({
      success: true,
      files,
      workspacePath: workspaceId,
      currentPath: targetPath
    });
  } catch (error: any) {
    console.error('Error listing files:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/terminal/files
 * Save file content
 */
export async function PUT(request: NextRequest) {
  try {
    const { workspaceId, clientId, path: filePath, content } = await request.json();

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

    // Ensure parent directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');

    return Response.json({
      success: true,
      message: 'File saved successfully',
      path: filePath
    });
  } catch (error: any) {
    console.error('Error saving file:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/terminal/files
 * Create new file or directory
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, clientId, path: filePath, type, content } = await request.json();

    if (!workspaceId || !clientId || !filePath || !type) {
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

    if (type === 'directory') {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      // Ensure parent directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content || '', 'utf8');
    }

    return Response.json({
      success: true,
      message: `${type === 'directory' ? 'Directory' : 'File'} created successfully`,
      path: filePath
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating file/directory:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/terminal/files
 * Delete file or directory
 */
export async function DELETE(request: NextRequest) {
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

    // Check if path exists
    if (!fs.existsSync(fullPath)) {
      return Response.json(
        { error: 'File or directory not found' },
        { status: 404 }
      );
    }

    // Delete file or directory
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }

    return Response.json({
      success: true,
      message: 'Deleted successfully',
      path: filePath
    });
  } catch (error: any) {
    console.error('Error deleting file/directory:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Build file tree recursively
 */
function buildFileTree(dirPath: string, basePath: string): FileNode[] {
  const items = fs.readdirSync(dirPath);

  return items.map((item) => {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.relative(basePath, fullPath);
    const stat = fs.statSync(fullPath);

    const node: FileNode = {
      name: item,
      path: relativePath.replace(/\\/g, '/'),
      type: stat.isDirectory() ? 'directory' : 'file',
      size: stat.size,
      modified: stat.mtime.toISOString()
    };

    if (stat.isDirectory()) {
      try {
        node.children = buildFileTree(fullPath, basePath);
      } catch (error) {
        console.error(`Error reading directory ${fullPath}:`, error);
        node.children = [];
      }
    }

    return node;
  }).sort((a, b) => {
    // Directories first, then alphabetically
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
