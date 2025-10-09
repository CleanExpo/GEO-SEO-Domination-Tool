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
    const { businessName, email, formData, currentStep } = body;

    if (!businessName || !email) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    await db.initialize();

    // Detect if using PostgreSQL (JSONB) or SQLite (TEXT)
    const isPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const formDataValue = isPostgres ? formData : JSON.stringify(formData);

    // Check if save already exists
    const existing = await db.queryOne(
      `SELECT id FROM saved_onboarding WHERE business_name = ? AND email = ?`,
      [businessName, email]
    );

    if (existing) {
      // Update existing save
      await db.query(
        `UPDATE saved_onboarding
         SET form_data = ?, current_step = ?, last_saved = ${isPostgres ? 'NOW()' : 'CURRENT_TIMESTAMP'}
         WHERE business_name = ? AND email = ?`,
        [formDataValue, currentStep, businessName, email]
      );
    } else {
      // Insert new save
      await db.query(
        `INSERT INTO saved_onboarding (business_name, email, form_data, current_step, last_saved)
         VALUES (?, ?, ?, ?, ${isPostgres ? 'NOW()' : 'CURRENT_TIMESTAMP'})`,
        [businessName, email, formDataValue, currentStep]
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
          dbType: db.getType(),
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
    await db.initialize();

    const saved = await db.queryOne(
      `SELECT form_data, current_step, last_saved
       FROM saved_onboarding
       WHERE business_name = ? AND email = ?`,
      [businessName, email]
    );

    if (!saved) {
      return NextResponse.json({
        found: false,
        message: 'No saved progress found'
      });
    }

    // Handle both JSONB (PostgreSQL) and TEXT (SQLite) formats
    const formData = typeof saved.form_data === 'string'
      ? JSON.parse(saved.form_data)
      : saved.form_data;

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
