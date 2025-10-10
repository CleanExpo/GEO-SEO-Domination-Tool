/**
 * Workspace List API
 *
 * Phase 1.2 Day 8-9: List all workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/database/init';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase('./data/geo-seo.db');

    const workspaces = db.prepare(
      `SELECT id, name, created_at, updated_at
       FROM workspaces
       ORDER BY updated_at DESC`
    ).all() as any[];

    return NextResponse.json({
      workspaces: workspaces.map((w) => ({
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
