/**
 * Workspace Save API
 *
 * Phase 1.2 Day 8-9: Save workspace state to database
 */

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const workspace = await request.json();

    if (!workspace.id || !workspace.name) {
      return NextResponse.json(
        { error: 'Workspace ID and name are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    await db.initialize();

    // Create table if it doesn't exist (PostgreSQL-compatible)
    await db.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        layout TEXT DEFAULT '{}',
        context TEXT DEFAULT '{}',
        open_files TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if workspace exists
    const existing = await db.get('SELECT id FROM workspaces WHERE id = ?', [workspace.id]);

    if (existing) {
      // Update existing workspace
      await db.run(
        `UPDATE workspaces
         SET name = ?,
             layout = ?,
             context = ?,
             open_files = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          workspace.name,
          JSON.stringify(workspace.layout || {}),
          JSON.stringify(workspace.context || {}),
          JSON.stringify(workspace.openFiles || []),
          workspace.id
        ]
      );
    } else {
      // Insert new workspace
      await db.run(
        `INSERT INTO workspaces (id, name, layout, context, open_files, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          workspace.id,
          workspace.name,
          JSON.stringify(workspace.layout || {}),
          JSON.stringify(workspace.context || {}),
          JSON.stringify(workspace.openFiles || [])
        ]
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
