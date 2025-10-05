/**
 * API Route: Organisation Themes
 * GET /api/themes?organisationId=xxx - Fetch organisation theme
 * PUT /api/themes - Update organisation theme
 * POST /api/themes/reset - Reset theme to defaults
 * Phase 3: THEME-001
 */

import { NextRequest, NextResponse } from 'next/server';
import { ThemeManager, ThemeUpdateInput } from '@/services/theme-manager';

// Initialize Theme Manager
const themeManager = new ThemeManager(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET - Fetch Organisation Theme
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get('organisationId');

    if (!organisationId) {
      return NextResponse.json(
        { error: 'organisationId query parameter is required' },
        { status: 400 }
      );
    }

    const theme = await themeManager.getOrganisationTheme(organisationId);

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found for organisation' },
        { status: 404 }
      );
    }

    return NextResponse.json({ theme }, { status: 200 });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update Organisation Theme
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organisationId, updates } = body as {
      organisationId: string;
      updates: ThemeUpdateInput;
    };

    if (!organisationId) {
      return NextResponse.json(
        { error: 'organisationId is required in request body' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'updates object is required and cannot be empty' },
        { status: 400 }
      );
    }

    const updatedTheme = await themeManager.updateOrganisationTheme(organisationId, updates);

    if (!updatedTheme) {
      return NextResponse.json(
        { error: 'Failed to update theme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ theme: updatedTheme }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Reset Theme to Defaults
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organisationId, action } = body;

    if (action === 'reset') {
      if (!organisationId) {
        return NextResponse.json(
          { error: 'organisationId is required for reset action' },
          { status: 400 }
        );
      }

      const resetTheme = await themeManager.resetOrganisationTheme(organisationId);

      if (!resetTheme) {
        return NextResponse.json(
          { error: 'Failed to reset theme' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { theme: resetTheme, message: 'Theme reset to defaults successfully' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action. Use action: "reset"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in theme POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
