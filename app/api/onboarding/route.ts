/**
 * Client Onboarding API
 *
 * POST /api/onboarding - Create new client onboarding
 * PATCH /api/onboarding/{id} - Update onboarding data
 * GET /api/onboarding/{id} - Get onboarding status
 * POST /api/onboarding/{id}/credentials - Add encrypted credential
 * GET /api/onboarding/{id}/credentials - Get masked credentials
 * DELETE /api/onboarding/{id}/credentials/{credId} - Delete credential
 *
 * Security:
 * - All credentials encrypted with AES-256-GCM before storage
 * - Admin/owner can NEVER see plaintext credentials
 * - Audit log for all credential access
 * - Client can update their own credentials anytime
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import { encrypt, decrypt, maskCredential, sanitizeCredential, validateCredentialFormat, hash } from '@/lib/encryption';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

// ============================================================================
// POST - Create New Client Onboarding
// ============================================================================

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.company_name || !body.contact_email || !body.industry || !body.primary_goal) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: company_name, contact_email, industry, primary_goal' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM client_onboarding WHERE contact_email = ?').get(body.contact_email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered. Please use a different email or contact support.' },
        { status: 409 }
      );
    }

    // Create client onboarding record
    const clientId = generateClientId();
    const insertStmt = db.prepare(`
      INSERT INTO client_onboarding (
        id, company_name, company_website, industry, company_size,
        contact_name, contact_email, contact_phone, contact_role,
        primary_goal, target_audience, monthly_marketing_budget, current_marketing_spend,
        primary_location, target_regions, main_competitors,
        existing_website, existing_social_profiles, current_ranking_keywords,
        selected_tier, selected_services,
        onboarding_step, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `);

    insertStmt.run(
      clientId,
      body.company_name,
      body.company_website || null,
      body.industry,
      body.company_size || null,
      body.contact_name || '',
      body.contact_email,
      body.contact_phone || null,
      body.contact_role || null,
      body.primary_goal,
      body.target_audience || null,
      body.monthly_marketing_budget || null,
      body.current_marketing_spend || null,
      body.primary_location || null,
      JSON.stringify(body.target_regions || []),
      JSON.stringify(body.main_competitors || []),
      body.existing_website || null,
      JSON.stringify(body.existing_social_profiles || {}),
      JSON.stringify(body.current_ranking_keywords || []),
      body.selected_tier || 'starter',
      JSON.stringify(body.selected_services || [])
    );

    // Initialize checklist
    const checklistTemplate = db.prepare('SELECT * FROM onboarding_checklist WHERE client_id = ?').all('template') as any[];
    const checklistStmt = db.prepare(`
      INSERT INTO onboarding_checklist (client_id, step_number, step_name, step_description, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    checklistTemplate.forEach(item => {
      checklistStmt.run(clientId, item.step_number, item.step_name, item.step_description, 'pending');
    });

    console.log(`[Onboarding] New client created: ${body.company_name} (${clientId})`);

    return NextResponse.json({
      success: true,
      clientId,
      message: 'Client onboarding created successfully',
      nextStep: 2,
      nextStepUrl: `/onboarding/${clientId}/step/2`
    });

  } catch (error: any) {
    console.error('[Onboarding API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// GET - Get Onboarding Status
// ============================================================================

export async function GET(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const email = searchParams.get('email');

    let client: any;

    if (clientId) {
      client = db.prepare('SELECT * FROM client_onboarding WHERE id = ?').get(clientId);
    } else if (email) {
      client = db.prepare('SELECT * FROM client_onboarding WHERE contact_email = ?').get(email);
    } else {
      return NextResponse.json(
        { success: false, error: 'clientId or email required' },
        { status: 400 }
      );
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get checklist
    const checklist = db.prepare('SELECT * FROM onboarding_checklist WHERE client_id = ? ORDER BY step_number')
      .all(client.id) as any[];

    // Get platform connections
    const connections = db.prepare('SELECT * FROM platform_connections WHERE client_id = ?')
      .all(client.id) as any[];

    // Parse JSON fields
    const clientData = {
      ...client,
      target_regions: JSON.parse(client.target_regions || '[]'),
      main_competitors: JSON.parse(client.main_competitors || '[]'),
      existing_social_profiles: JSON.parse(client.existing_social_profiles || '{}'),
      current_ranking_keywords: JSON.parse(client.current_ranking_keywords || '[]'),
      selected_services: JSON.parse(client.selected_services || '[]'),
      checklist,
      connections
    };

    return NextResponse.json({
      success: true,
      client: clientData
    });

  } catch (error: any) {
    console.error('[Onboarding API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// PATCH - Update Onboarding Data
// ============================================================================

export async function PATCH(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const body = await request.json();
    const clientId = body.clientId;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId required' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'company_name', 'company_website', 'industry', 'company_size',
      'contact_name', 'contact_phone', 'contact_role',
      'primary_goal', 'target_audience', 'monthly_marketing_budget', 'current_marketing_spend',
      'primary_location', 'target_regions', 'main_competitors',
      'existing_website', 'existing_social_profiles', 'current_ranking_keywords',
      'selected_tier', 'selected_services',
      'onboarding_step', 'onboarding_completed', 'credentials_configured', 'first_campaign_launched'
    ];

    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key) && body[key] !== undefined) {
        updates.push(`${key} = ?`);

        // JSON fields
        if (['target_regions', 'main_competitors', 'existing_social_profiles', 'current_ranking_keywords', 'selected_services'].includes(key)) {
          values.push(JSON.stringify(body[key]));
        } else {
          values.push(body[key]);
        }
      }
    });

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(clientId);

    const query = `UPDATE client_onboarding SET ${updates.join(', ')} WHERE id = ?`;
    const result = db.prepare(query).run(...values);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // If onboarding completed, create portfolio
    if (body.onboarding_completed === 1 || body.onboarding_completed === true) {
      const client = db.prepare('SELECT * FROM client_onboarding WHERE id = ?').get(clientId) as any;

      if (client && !client.portfolio_id) {
        const portfolioId = generatePortfolioId();

        // Create portfolio
        db.prepare(`
          INSERT INTO company_portfolios (
            id, company_name, website, industry, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `).run(
          portfolioId,
          client.company_name,
          client.company_website || client.existing_website,
          client.industry
        );

        // Link portfolio to client
        db.prepare('UPDATE client_onboarding SET portfolio_id = ?, completed_at = datetime(\'now\') WHERE id = ?')
          .run(portfolioId, clientId);

        console.log(`[Onboarding] Client ${clientId} completed onboarding, portfolio ${portfolioId} created`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully'
    });

  } catch (error: any) {
    console.error('[Onboarding API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

function generatePortfolioId(): string {
  // Generate UUID for PostgreSQL compatibility
  return randomUUID();
}
