/**
 * Bytebot Tasks API
 *
 * Proxy endpoint for creating and listing Bytebot tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBytebotClient } from '@/lib/bytebot-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const priority = (formData.get('priority') as string) || 'MEDIUM';
    const metadataStr = formData.get('metadata') as string;
    const files = formData.getAll('files') as File[];

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const metadata = metadataStr ? JSON.parse(metadataStr) : undefined;

    const bytebot = getBytebotClient();
    const task = await bytebot.createTask(description, {
      priority: priority as any,
      files: files.length > 0 ? files : undefined,
      metadata
    });

    return NextResponse.json({
      success: true,
      task
    });
  } catch (error: any) {
    console.error('Error creating Bytebot task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const bytebot = getBytebotClient();
    const result = await bytebot.listTasks({
      status: status as any,
      priority: priority as any,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing Bytebot tasks:', error);
    return NextResponse.json(
      { error: 'Failed to list tasks', details: error.message },
      { status: 500 }
    );
  }
}
