/**
 * Save/Load Onboarding Progress API
 *
 * POST: Save onboarding progress
 * GET: Load saved onboarding progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

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

    const supabase = createAdminClient();

    // Check if save already exists
    const { data: existing } = await supabase
      .from('saved_onboarding')
      .select('id')
      .eq('business_name', businessName)
      .eq('email', email)
      .single();

    if (existing) {
      // Update existing save
      const { error } = await supabase
        .from('saved_onboarding')
        .update({
          form_data: dataToSave,
          current_step: currentStep,
          last_saved: new Date().toISOString()
        })
        .eq('business_name', businessName)
        .eq('email', email);

      if (error) throw error;
    } else {
      // Insert new save
      const { error } = await supabase
        .from('saved_onboarding')
        .insert([{
          business_name: businessName,
          email,
          form_data: dataToSave,
          current_step: currentStep,
          last_saved: new Date().toISOString()
        }]);

      if (error) throw error;
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

    const supabase = createAdminClient();

    // Case-insensitive search using ilike
    const { data: saved, error } = await supabase
      .from('saved_onboarding')
      .select('form_data, current_step, last_saved, business_name, email')
      .ilike('business_name', businessName.trim())
      .ilike('email', email.trim())
      .single();

    if (error || !saved) {
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

    return NextResponse.json({
      found: true,
      formData: saved.form_data,
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
