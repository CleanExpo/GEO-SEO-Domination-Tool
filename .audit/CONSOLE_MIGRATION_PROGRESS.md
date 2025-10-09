# Console.log Migration Progress

**Started:** 2025-10-09
**Target:** 742 console statements → Sentry
**Strategy:** Replace errors/warns first, then info/debug

## Files Migrated (Critical Errors)

### Services Layer (API)

1. ✅ **services/api/claude.ts** (1 error)
   - Replaced: `console.error('Claude API error:', error)`
   - With: Sentry.captureException with tags (service, model, operation)

2. ✅ **services/api/dataforseo.ts** (4 statements)
   - Replaced 1 error: API error handling
   - Replaced 2 warnings: Mock data fallbacks → breadcrumbs
   - With: Sentry.captureException + breadcrumbs for warnings

### Progress Metrics

**Statements Migrated:** 5 / 742 (0.7%)
**Files Completed:** 2 / ~50 API files
**Time Invested:** 15 minutes
**Estimated Remaining:** 7.75 hours

## Next Priority Files

1. services/api/ai-search.ts (1 error)
2. services/api/deepseek-*.ts (50+ statements)
3. app/api/companies/route.ts (critical)
4. app/api/keywords/route.ts (critical)
5. database/init.ts (critical)

## Migration Patterns Used

### Pattern 1: Critical Errors
```typescript
// Before
console.error('API error:', error);

// After
Sentry.captureException(error, {
  tags: { service: 'name', operation: 'method' },
  contexts: { serviceName: { ...context } }
});
```

### Pattern 2: Warnings (Non-blocking)
```typescript
// Before
console.warn('Falling back to mock data');

// After
Sentry.addBreadcrumb({
  category: 'service',
  message: 'Falling back to mock data',
  level: 'warning',
  data: { context }
});
```

### Pattern 3: Info/Debug (to be converted)
```typescript
// Before
console.log('Processing:', id);

// After (development only)
if (process.env.NODE_ENV === 'development') {
  Sentry.addBreadcrumb({
    category: 'debug',
    message: 'Processing',
    data: { id },
    level: 'info'
  });
}
```

