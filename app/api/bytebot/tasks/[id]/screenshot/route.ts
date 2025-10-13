/**
 * Bytebot Task Screenshot API
 *
 * Get the latest screenshot from a Bytebot task
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
    const screenshot = await bytebot.getTaskScreenshot(id);

    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('Error getting task screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to get screenshot', details: error.message },
      { status: 500 }
    );
  }
}
