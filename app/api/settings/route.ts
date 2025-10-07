import { NextRequest, NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const settingsSchema = z.object({
  full_name: z.string().optional(),
  company_name: z.string().optional(),
  preferences: z.object({
    email_notifications: z.boolean().optional(),
    weekly_reports: z.boolean().optional(),
    ranking_alerts: z.boolean().optional(),
  }).optional(),
});

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get existing settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - which is fine, we'll create defaults
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no settings exist, return defaults
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        full_name: user.user_metadata?.full_name || '',
        company_name: '',
        preferences: {
          email_notifications: true,
          weekly_reports: true,
          ranking_alerts: true,
        },
      };

      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update(validatedData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('user_settings')
        .insert([{ user_id: user.id, ...validatedData }])
        .select()
        .single();

      if (error) {
        console.error('Error creating settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ settings: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in PATCH /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
