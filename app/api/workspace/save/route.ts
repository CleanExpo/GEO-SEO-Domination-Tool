/**
 * Workspace Save API
 *
 * Phase 1.2 Day 8-9: Save workspace state to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/database/init';

export async function POST(request: NextRequest) {
  try {
    const workspace = await request.json();

    if (!workspace.id || !workspace.name) {
      return NextResponse.json(
        { error: 'Workspace ID and name are required' },
        { status: 400 }
      );
    }

    const db = getDatabase('./data/geo-seo.db');

    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        layout TEXT DEFAULT '{}',
        context TEXT DEFAULT '{}',
        open_files TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if workspace exists
    const existing = db.prepare('SELECT id FROM workspaces WHERE id = ?').all(workspace.id) as any[];

    if (existing.length > 0) {
      // Update existing workspace
      db.prepare(
        `UPDATE workspaces
         SET name = ?,
             layout = ?,
             context = ?,
             open_files = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        workspace.name,
        JSON.stringify(workspace.layout || {}),
        JSON.stringify(workspace.context || {}),
        JSON.stringify(workspace.openFiles || []),
        workspace.id
      );
    } else {
      // Insert new workspace
      db.prepare(
        `INSERT INTO workspaces (id, name, layout, context, open_files, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).run(
        workspace.id,
        workspace.name,
        JSON.stringify(workspace.layout || {}),
        JSON.stringify(workspace.context || {}),
        JSON.stringify(workspace.openFiles || [])
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workspace saved successfully',
      id: workspace.id,
    });
  } catch (error: any) {
    console.error('[Workspace Save API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save workspace' },
      { status: 500 }
    );
  }
}
