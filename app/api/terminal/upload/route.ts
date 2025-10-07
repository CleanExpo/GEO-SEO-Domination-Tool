/**
 * Terminal File Upload API
 *
 * POST: Upload files to workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BASE_WORKSPACE_PATH = 'D:/GEO_SEO_Domination-Tool/workspaces';

/**
 * POST /api/terminal/upload
 * Upload file to workspace
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;
    const clientId = formData.get('clientId') as string;
    const targetPath = formData.get('targetPath') as string || '/';

    if (!file || !workspaceId || !clientId) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const workspacePath = path.join(BASE_WORKSPACE_PATH, clientId, workspaceId);
    const targetDir = path.join(workspacePath, targetPath);

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, file.name);

    // Security: Prevent path traversal
    if (!filePath.startsWith(workspacePath)) {
      return Response.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.writeFileSync(filePath, buffer);

    const relativePath = path.relative(workspacePath, filePath).replace(/\\/g, '/');

    return Response.json({
      success: true,
      message: 'File uploaded successfully',
      path: relativePath,
      name: file.name,
      size: file.size
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
