/**
 * Workspace Load API
 *
 * Phase 1.2 Day 8-9: Load workspace state from database
 */

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    await db.initialize();

    const workspace = await db.get('SELECT * FROM workspaces WHERE id = ?', [id]);

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        layout: JSON.parse(workspace.layout || '{}'),
        context: JSON.parse(workspace.context || '{}'),
        openFiles: JSON.parse(workspace.open_files || '[]'),
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      },
    });
  } catch (error: any) {
    console.error('[Workspace Load API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load workspace' },
      { status: 500 }
    );
  }
}
