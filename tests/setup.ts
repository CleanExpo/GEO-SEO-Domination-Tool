/**
 * Vitest Test Setup
 * Configures global test environment
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SQLITE_PATH = ':memory:'; // Use in-memory database for tests

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Supabase client
vi.mock('@/lib/auth/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Global test utilities
global.console = {
  ...console,
  error: vi.fn(), // Mock console.error to reduce noise in tests
  warn: vi.fn(), // Mock console.warn
};
