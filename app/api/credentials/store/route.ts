/**
 * Credential Storage API Endpoint
 *
 * POST /api/credentials/store
 * Store encrypted credentials for a company
 *
 * This is the ACTUAL internal mechanism that connects the UI to the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { storeCredential, storeOnboardingCredentials } from '@/services/credentials/credential-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, websiteAccess, socialMedia, googleEcosystem, singleCredential } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Handle single credential storage
    if (singleCredential) {
      const credentialId = await storeCredential(singleCredential);

      return NextResponse.json({
        success: true,
        credentialId,
        message: `${singleCredential.platformName} credentials stored successfully`
      });
    }

    // Handle batch credential storage from onboarding
    const credentialIds = await storeOnboardingCredentials(
      companyId,
      websiteAccess,
      socialMedia,
      googleEcosystem
    );

    return NextResponse.json({
      success: true,
      credentialIds,
      count: credentialIds.length,
      message: `Stored ${credentialIds.length} credential(s) successfully`
    });

  } catch (error: any) {
    console.error('[CredentialStoreAPI] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to store credentials',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
