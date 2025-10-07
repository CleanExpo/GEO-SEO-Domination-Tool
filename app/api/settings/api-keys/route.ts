import { NextRequest, NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/auth/supabase-server';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const createKeySchema = z.object({
  key_name: z.string().min(1, 'Key name is required'),
});

const updateKeySchema = z.object({
  key_id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'sk_live_';
  const randomPart = randomBytes(32).toString('base64url');
  return `${prefix}${randomPart}`;
}

// GET /api/settings/api-keys - List all API keys for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('id, key_name, api_key_prefix, is_active, last_used_at, created_at, revoked_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ apiKeys: apiKeys || [] });
  } catch (error) {
    console.error('Error in GET /api/settings/api-keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/settings/api-keys - Generate a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createKeySchema.parse(body);

    // Generate the API key
    const apiKey = generateApiKey();
    const apiKeyPrefix = apiKey.substring(0, 12) + '...'; // Show first 12 chars

    const { data, error } = await supabase
      .from('user_api_keys')
      .insert([
        {
          user_id: user.id,
          key_name: validatedData.key_name,
          api_key: apiKey,
          api_key_prefix: apiKeyPrefix,
          is_active: true,
        },
      ])
      .select('id, key_name, api_key_prefix, is_active, created_at')
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the full key only once (on creation)
    return NextResponse.json(
      {
        apiKey: data,
        fullKey: apiKey,
        message: 'API key created successfully. Save this key - it will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/settings/api-keys:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/api-keys - Update API key (revoke/activate)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateKeySchema.parse(body);

    // Verify the key belongs to the user
    const { data: existingKey, error: fetchError } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('id', validatedData.key_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (validatedData.is_active !== undefined) {
      updateData.is_active = validatedData.is_active;
      if (!validatedData.is_active) {
        updateData.revoked_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .update(updateData)
      .eq('id', validatedData.key_id)
      .eq('user_id', user.id)
      .select('id, key_name, api_key_prefix, is_active, revoked_at')
      .single();

    if (error) {
      console.error('Error updating API key:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ apiKey: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error in PATCH /api/settings/api-keys:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/api-keys - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting API key:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/settings/api-keys:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
