/**
 * Workspace List API
 *
 * Phase 1.2 Day 8-9: List all workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import getDatabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    await db.initialize();

    const workspaces = await db.all(
      `SELECT id, name, created_at, updated_at
       FROM workspaces
       ORDER BY updated_at DESC`
    );

    return NextResponse.json({
      workspaces: workspaces.map((w: any) => ({
        id: w.id,
        name: w.name,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('[Workspace List API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list workspaces' },
      { status: 500 }
    );
  }
}
