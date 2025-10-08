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

    const db = await getDatabase();

    // Check if save already exists
    const existing = await db.get(
      `SELECT id FROM saved_onboarding WHERE business_name = ? AND email = ?`,
      [businessName, email]
    );

    if (existing) {
      // Update existing save
      await db.run(
        `UPDATE saved_onboarding
         SET form_data = ?, current_step = ?, last_saved = CURRENT_TIMESTAMP
         WHERE business_name = ? AND email = ?`,
        [JSON.stringify(formData), currentStep, businessName, email]
      );
    } else {
      // Insert new save
      await db.run(
        `INSERT INTO saved_onboarding (business_name, email, form_data, current_step, last_saved)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [businessName, email, JSON.stringify(formData), currentStep]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully'
    });

  } catch (error: any) {
    console.error('Failed to save onboarding progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to save progress',
        details: error.message
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

    const db = await getDatabase();

    const saved = await db.get(
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

    return NextResponse.json({
      found: true,
      formData: JSON.parse(saved.form_data),
      currentStep: saved.current_step,
      lastSaved: saved.last_saved
    });

  } catch (error: any) {
    console.error('Failed to load onboarding progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to load progress',
        details: error.message
      },
      { status: 500 }
    );
  }
}
