import { NextResponse } from 'next/server';
import { validateEncryptionKey, testEncryption } from '@/lib/encryption';

export async function GET() {
  // Validate encryption configuration
  const encryptionValidation = validateEncryptionKey();
  const encryptionTest = encryptionValidation.valid ? testEncryption() : { success: false, message: 'Key not configured' };

  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
    encryptionKeyValid: encryptionValidation.valid,
    encryptionKeyMessage: encryptionValidation.message,
    encryptionTestPassed: encryptionTest.success,
    encryptionTestMessage: encryptionTest.message,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    isVercel: !!process.env.VERCEL,
  });
}
