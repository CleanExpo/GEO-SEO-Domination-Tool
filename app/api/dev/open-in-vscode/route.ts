// Click-to-Code API Endpoint
// Opens source files in VS Code from browser inspector

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface OpenInVSCodeRequest {
  filepath: string;
  line?: number;
  column?: number;
}

/**
 * POST /api/dev/open-in-vscode
 * Opens a file in VS Code at specified line/column
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    const body: OpenInVSCodeRequest = await request.json();

    // Validate request
    if (!body.filepath) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: filepath' },
        { status: 400 }
      );
    }

    // Resolve file path
    const resolvedPath = await resolveFilePath(body.filepath);

    if (!resolvedPath) {
      return NextResponse.json(
        { success: false, error: `Could not resolve file: ${body.filepath}` },
        { status: 404 }
      );
    }

    // Build VS Code command
    let vscodeCommand = `code -g "${resolvedPath}"`;

    if (body.line) {
      vscodeCommand = `code -g "${resolvedPath}:${body.line}${body.column ? `:${body.column}` : ''}"`;
    }

    // Execute command
    try {
      await execAsync(vscodeCommand);

      return NextResponse.json({
        success: true,
        message: 'File opened in VS Code',
        filepath: resolvedPath,
        line: body.line,
        column: body.column
      });
    } catch (error: any) {
      console.error('❌ Failed to execute VS Code command:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to open in VS Code. Make sure VS Code CLI is installed.',
          details: error.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error in open-in-vscode endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Resolve component path to actual file path
 * Handles various path formats:
 * - Relative paths: "components/Sidebar.tsx"
 * - Absolute paths: "D:/GEO_SEO_Domination-Tool/components/Sidebar.tsx"
 * - Component names: "Sidebar" -> searches for file
 */
async function resolveFilePath(filepath: string): Promise<string | null> {
  const fs = await import('fs');
  const path = await import('path');

  // If absolute path and exists, return as-is
  if (path.isAbsolute(filepath) && fs.existsSync(filepath)) {
    return filepath;
  }

  // If relative path, resolve from project root
  const projectRoot = process.cwd();
  const absolutePath = path.join(projectRoot, filepath);

  if (fs.existsSync(absolutePath)) {
    return absolutePath;
  }

  // Try common directories
  const commonDirs = [
    'components',
    'app',
    'lib',
    'services',
    'types',
    'utils'
  ];

  for (const dir of commonDirs) {
    const searchPath = path.join(projectRoot, dir, filepath);

    if (fs.existsSync(searchPath)) {
      return searchPath;
    }

    // Try with .tsx extension
    if (fs.existsSync(`${searchPath}.tsx`)) {
      return `${searchPath}.tsx`;
    }

    // Try with .ts extension
    if (fs.existsSync(`${searchPath}.ts`)) {
      return `${searchPath}.ts`;
    }
  }

  // If just component name, search recursively
  if (!filepath.includes('/') && !filepath.includes('\\')) {
    const found = await searchForFile(projectRoot, filepath);
    if (found) return found;
  }

  return null;
}

/**
 * Recursively search for a file by name
 */
async function searchForFile(
  dir: string,
  filename: string,
  maxDepth: number = 5,
  currentDepth: number = 0
): Promise<string | null> {
  if (currentDepth >= maxDepth) return null;

  const fs = await import('fs');
  const path = await import('path');

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip node_modules and .next
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
        continue;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const found = await searchForFile(fullPath, filename, maxDepth, currentDepth + 1);
        if (found) return found;
      } else {
        // Check if filename matches (with or without extension)
        const baseName = path.basename(entry.name, path.extname(entry.name));
        const searchBaseName = path.basename(filename, path.extname(filename));

        if (baseName === searchBaseName) {
          return fullPath;
        }
      }
    }
  } catch (error) {
    // Permission denied or other error, skip
  }

  return null;
}

/**
 * GET /api/dev/open-in-vscode
 * Health check and configuration info
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  // Check if VS Code CLI is available
  try {
    await execAsync('code --version');

    return NextResponse.json({
      status: 'operational',
      vscodeCliAvailable: true,
      projectRoot: process.cwd(),
      usage: {
        endpoint: 'POST /api/dev/open-in-vscode',
        body: {
          filepath: 'string (required)',
          line: 'number (optional)',
          column: 'number (optional)'
        },
        example: {
          filepath: 'components/Sidebar.tsx',
          line: 42,
          column: 10
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      vscodeCliAvailable: false,
      error: 'VS Code CLI not found in PATH. Install with: code --install',
      projectRoot: process.cwd()
    });
  }
}
