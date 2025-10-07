# Test Suite Setup

This directory contains automated tests for the GEO-SEO Domination Tool.

## Structure

```
tests/
├── setup.md                    # This file
├── unit/                       # Unit tests for individual functions
│   ├── lib/                   # Tests for lib utilities
│   ├── services/              # Tests for service layer
│   └── api/                   # Tests for API integrations
├── integration/               # Integration tests
│   ├── database/             # Database integration tests
│   ├── api/                  # API endpoint tests
│   └── workflows/            # End-to-end workflow tests
└── e2e/                      # End-to-end browser tests
    └── playwright/           # Playwright test suite
```

## Installation

Install testing dependencies:

```bash
npm install --save-dev @playwright/test vitest @testing-library/react @testing-library/jest-dom
```

## Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/lib/seo-audit.test.ts
import { describe, it, expect } from 'vitest';
import { calculateEEATScore } from '@/lib/seo-audit';

describe('SEO Audit', () => {
  it('should calculate E-E-A-T score correctly', () => {
    const metrics = {
      contentQuality: 85,
      expertise: 90,
      authoritativeness: 75,
      trustworthiness: 80
    };

    const score = calculateEEATScore(metrics);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

### Integration Test Example

```typescript
// tests/integration/api/rankings.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseClient } from '@/lib/db';

describe('Rankings API', () => {
  let db: DatabaseClient;

  beforeAll(async () => {
    db = new DatabaseClient();
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should fetch keyword rankings', async () => {
    const result = await db.query('SELECT * FROM rankings LIMIT 1');
    expect(result.rows).toBeDefined();
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/playwright/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard loads successfully', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage for lib/ and services/
- **Integration Tests:** All API endpoints and database operations
- **E2E Tests:** Critical user workflows

## CI/CD Integration

Tests run automatically on:
- Git pre-commit hook (unit tests only)
- Pull request creation (all tests)
- Deployment to staging (all tests + E2E)
- Production deployment (smoke tests)

## Mocking External APIs

Use environment variables to switch between real and mock APIs:

```typescript
const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY || 'mock';
const USE_MOCK = !SEMRUSH_API_KEY || SEMRUSH_API_KEY === 'mock';
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
