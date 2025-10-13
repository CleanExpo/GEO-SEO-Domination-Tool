import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import axios from 'axios';

/**
 * POST /api/onboarding/complete
 *
 * Complete client onboarding workflow:
 * 1. Scrape website data (via lookup endpoint)
 * 2. Create company profile in database
 * 3. Trigger comprehensive SEO audit automatically
 * 4. Return company + audit IDs for redirect
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      website,
      location,
      industry,
      contactName,
      contactEmail,
      contactPhone,
    } = body;

    // Validation
    if (!businessName || !website) {
      return NextResponse.json(
        { error: 'businessName and website are required' },
        { status: 400 }
      );
    }

    console.log(`[Onboarding] Starting for ${businessName} - ${website}`);

    const supabase = await createClient();

    // 1. Check if company already exists
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('website', website)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: 'Company with this website already exists',
          company_id: existing.id,
          redirect_url: `/companies/${existing.id}`,
        },
        { status: 409 }
      );
    }

    // 2. Scrape website data using our lookup endpoint
    console.log(`[Onboarding] Scraping website data...`);

    let scrapedData: any = {};
    try {
      const lookupUrl = new URL('/api/onboarding/lookup', request.url);
      const lookupResponse = await fetch(lookupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }),
      });

      if (lookupResponse.ok) {
        const lookupResult = await lookupResponse.json();
        scrapedData = lookupResult.data || {};
        console.log(`[Onboarding] Scraped data:`, Object.keys(scrapedData));
      } else {
        console.warn(`[Onboarding] Lookup failed, using provided data only`);
      }
    } catch (error) {
      console.error(`[Onboarding] Scraping error:`, error);
      // Continue without scraped data
    }

    // 3. Extract domain for database
    const domain = new URL(website).hostname.replace('www.', '');

    // 4. Create company profile
    console.log(`[Onboarding] Creating company profile...`);

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: businessName,
        website,
        domain,
        location: location || scrapedData.address || null,
        industry: industry || scrapedData.industry || null,
        phone: scrapedData.phone || contactPhone || null,
        email: scrapedData.email || contactEmail || null,
        description: scrapedData.description || null,
        metadata: {
          contact_name: contactName,
          platform: scrapedData.platform || 'unknown',
          has_schema: scrapedData.hasSchema || false,
          onboarded_at: new Date().toISOString(),
          scraped_data: scrapedData,
        },
      })
      .select()
      .single();

    if (companyError) {
      console.error('[Onboarding] Company creation error:', companyError);
      throw companyError;
    }

    console.log(`[Onboarding] Company created: ${company.id}`);

    // 5. Trigger comprehensive audit automatically
    console.log(`[Onboarding] Triggering comprehensive audit...`);

    let auditId = null;
    let auditError = null;

    try {
      const auditUrl = new URL(`/api/companies/${company.id}/audit/comprehensive`, request.url);
      const auditResponse = await fetch(auditUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (auditResponse.ok) {
        const auditResult = await auditResponse.json();
        auditId = auditResult.audit_id;
        console.log(`[Onboarding] Audit triggered: ${auditId}`);
      } else {
        const errorData = await auditResponse.json();
        auditError = errorData.error || 'Audit trigger failed';
        console.error(`[Onboarding] Audit trigger failed:`, auditError);
      }
    } catch (error: any) {
      console.error(`[Onboarding] Audit trigger error:`, error);
      auditError = error.message;
    }

    // 6. If audit triggered successfully, redirect to audit page
    // If audit failed, redirect to company dashboard (they can trigger manually)
    const redirectUrl = auditId
      ? `/companies/${company.id}/seo-audit?audit_id=${auditId}`
      : `/companies/${company.id}`;

    // 7. Create initial keywords (based on business name and industry)
    console.log(`[Onboarding] Creating initial keywords...`);

    const initialKeywords = generateInitialKeywords(businessName, industry, location);

    if (initialKeywords.length > 0) {
      await supabase.from('keywords').insert(
        initialKeywords.map((keyword: string) => ({
          company_id: company.id,
          keyword,
          source: 'onboarding',
          status: 'pending',
          metadata: {
            created_during_onboarding: true,
          },
        }))
      );
      console.log(`[Onboarding] Created ${initialKeywords.length} initial keywords`);
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      company_id: company.id,
      company_name: company.name,
      audit_id: auditId,
      audit_status: auditId ? 'running' : 'failed',
      audit_error: auditError,
      redirect_url: redirectUrl,
      next_steps: auditId
        ? [
            'Review comprehensive SEO audit results',
            'Generate improvement tasks from audit findings',
            'Configure website access credentials for autonomous execution',
          ]
        : [
            'Trigger manual SEO audit from dashboard',
            'Configure website access credentials',
            'Set up monitoring and alerts',
          ],
    });

  } catch (error: any) {
    console.error('[Onboarding] Error:', error);
    return NextResponse.json(
      {
        error: 'Onboarding failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate initial keywords based on business context
 */
function generateInitialKeywords(
  businessName: string,
  industry: string | null,
  location: string | null
): string[] {
  const keywords: string[] = [];

  // Core business keyword
  const businessKeyword = businessName.toLowerCase()
    .replace(/\b(inc|llc|ltd|pty|co|company|group)\b/gi, '')
    .trim();

  if (businessKeyword) {
    keywords.push(businessKeyword);
  }

  // Industry-based keywords
  if (industry) {
    const industryLower = industry.toLowerCase();
    keywords.push(industryLower);

    // Add "near me" variant for local businesses
    if (location) {
      keywords.push(`${industryLower} near me`);
      keywords.push(`${industryLower} ${location}`);
    }

    // Add common service keywords
    const serviceVariants = [
      `best ${industryLower}`,
      `${industryLower} services`,
      `professional ${industryLower}`,
    ];

    if (location) {
      serviceVariants.push(`${industryLower} in ${location}`);
    }

    keywords.push(...serviceVariants.slice(0, 3)); // Limit to avoid too many
  }

  // Add branded keyword
  keywords.push(businessName.toLowerCase());

  // Deduplicate and return
  return [...new Set(keywords)].filter((k) => k.length > 2).slice(0, 10);
}
