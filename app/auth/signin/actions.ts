'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function handleGoogleSignIn() {
  try {
    await signIn('google', { redirectTo: '/dashboard' });
  } catch (error) {
    if (error instanceof AuthError) {
      // Handle specific auth errors
      throw new Error(error.message);
    }
    // Re-throw other errors
    throw error;
  }
}
