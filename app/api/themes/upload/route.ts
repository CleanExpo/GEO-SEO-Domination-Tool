/**
 * API Route: Theme Asset Upload
 * POST /api/themes/upload - Upload brand assets to Supabase Storage
 * Phase 3: THEME-001
 */

import { NextRequest, NextResponse } from 'next/server';
import { ThemeManager } from '@/services/theme-manager';

const themeManager = new ThemeManager(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organisationId = formData.get('organisationId') as string;
    const type = formData.get('type') as 'logo' | 'logo-dark' | 'favicon';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!organisationId) {
      return NextResponse.json({ error: 'organisationId is required' }, { status: 400 });
    }

    if (!type || !['logo', 'logo-dark', 'favicon'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be logo, logo-dark, or favicon' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const url = await themeManager.uploadBrandAsset(organisationId, file, type);

    if (!url) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Error uploading theme asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
