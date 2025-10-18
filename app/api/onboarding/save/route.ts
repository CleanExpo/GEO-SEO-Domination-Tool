/**
 * Save/Load Onboarding Progress API
 *
 * POST: Save onboarding progress
 * GET: Load saved onboarding progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, email, formData, currentStep, onboardingData } = body;

    if (!businessName || !email) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    // Use formData if provided, otherwise use onboardingData, or default to empty object
    const dataToSave = formData || onboardingData || {};

    const db = getDatabase();

    // Check if save already exists using queryOne (base method, not tree-shaken)
    const existing = await db.queryOne(
      'SELECT id FROM saved_onboarding WHERE business_name = ? AND email = ?',
      [businessName, email]
    );

    if (existing) {
      // Update existing save using query (base method)
      await db.query(
        `UPDATE saved_onboarding
         SET form_data = ?, current_step = ?, last_saved = CURRENT_TIMESTAMP
         WHERE business_name = ? AND email = ?`,
        [JSON.stringify(dataToSave), currentStep, businessName, email]
      );
    } else {
      // Insert new save using query (base method)
      await db.query(
        `INSERT INTO saved_onboarding (business_name, email, form_data, current_step, last_saved)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [businessName, email, JSON.stringify(dataToSave), currentStep]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully'
    });

  } catch (error: any) {
    console.error('Failed to save onboarding progress:', error);

    // Check if error is due to missing table
    const isMissingTable = error.message?.includes('does not exist') ||
                          error.message?.includes('relation') ||
                          error.code === '42P01'; // PostgreSQL error code for undefined table

    if (isMissingTable) {
      console.error('❌ CRITICAL: saved_onboarding table does not exist in database!');
      console.error('Run database/supabase-saved-onboarding.sql in Supabase SQL Editor');
      console.error('See SUPABASE_SAVED_ONBOARDING_SETUP.md for instructions');

      return NextResponse.json(
        {
          error: 'Database table not initialized',
          details: 'The saved_onboarding table does not exist. Please contact support.',
          code: 'TABLE_MISSING',
          instructions: 'See SUPABASE_SAVED_ONBOARDING_SETUP.md'
        },
        { status: 500 }
      );
    }

    // Add debug info to error response (temporary for debugging)
    return NextResponse.json(
      {
        error: 'Failed to save progress',
        details: error.message,
        code: error.code,
        debug: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          errorName: error.name,
          errorStack: error.stack?.split('\n').slice(0, 3).join('\n')
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessName = searchParams.get('businessName');
    const email = searchParams.get('email');

    if (!businessName || !email) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Case-insensitive search using queryOne (base method, not tree-shaken)
    const saved = await db.queryOne(
      `SELECT form_data, current_step, last_saved, business_name, email
       FROM saved_onboarding
       WHERE LOWER(business_name) = LOWER(?) AND LOWER(email) = LOWER(?)`,
      [businessName.trim(), email.trim()]
    );

    if (!saved) {
      // For debugging: show what we searched for
      console.log('[Load] No saved data found for:', {
        businessName: businessName.trim(),
        email: email.trim()
      });

      return NextResponse.json({
        found: false,
        message: 'No saved progress found',
        searchedFor: {
          businessName: businessName.trim(),
          email: email.trim()
        }
      });
    }

    console.log('[Load] Found saved data for:', {
      businessName: saved.business_name,
      email: saved.email
    });

    // Parse JSON form_data if it's a string
    let formData = saved.form_data;
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (e) {
        console.error('Failed to parse form_data:', e);
      }
    }

    return NextResponse.json({
      found: true,
      formData,
      currentStep: saved.current_step,
      lastSaved: saved.last_saved
    });

  } catch (error: any) {
    console.error('Failed to load onboarding progress:', error);

    // Check if error is due to missing table
    const isMissingTable = error.message?.includes('does not exist') ||
                          error.message?.includes('relation') ||
                          error.code === '42P01';

    if (isMissingTable) {
      console.error('❌ CRITICAL: saved_onboarding table does not exist in database!');
      console.error('Run database/supabase-saved-onboarding.sql in Supabase SQL Editor');

      return NextResponse.json(
        {
          error: 'Database table not initialized',
          details: 'The saved_onboarding table does not exist. Please contact support.',
          code: 'TABLE_MISSING'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to load progress',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
