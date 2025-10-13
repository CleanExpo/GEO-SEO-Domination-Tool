/**
 * Bytebot Task Details API
 *
 * Get, update, or cancel a specific Bytebot task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBytebotClient } from '@/lib/bytebot-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bytebot = getBytebotClient();
    const task = await bytebot.getTask(id);

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error getting Bytebot task:', error);
    return NextResponse.json(
      { error: 'Failed to get task', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bytebot = getBytebotClient();
    await bytebot.cancelTask(id);

    return NextResponse.json({ success: true, message: 'Task cancelled' });
  } catch (error: any) {
    console.error('Error cancelling Bytebot task:', error);
    return NextResponse.json(
      { error: 'Failed to cancel task', details: error.message },
      { status: 500 }
    );
  }
}
