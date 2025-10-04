import { NextResponse } from 'next/server';
import { listSeoFiles, readSeoFile } from '@/lib/files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      // List all SEO files
      const files = await listSeoFiles();
      return NextResponse.json({ ok: true, files });
    }

    // Read specific file
    const { path, content } = await readSeoFile(fileName);

    // Parse JSON files for preview stats
    let parsed: any = null;
    let stats: any = null;

    if (fileName.endsWith('.json')) {
      try {
        parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          stats = { type: 'array', count: parsed.length };
        } else if (parsed && typeof parsed === 'object') {
          stats = { type: 'object', keys: Object.keys(parsed).length };
        }
      } catch (e) {
        stats = { error: 'Invalid JSON' };
      }
    } else if (fileName.endsWith('.csv')) {
      const lines = content.split(/\r?\n/).filter(l => l.trim());
      stats = { type: 'csv', rows: lines.length - 1, hasHeader: lines.length > 0 };
    }

    return NextResponse.json({
      ok: true,
      file: fileName,
      path,
      content,
      stats
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to fetch SEO results'
    }, { status: 500 });
  }
}
