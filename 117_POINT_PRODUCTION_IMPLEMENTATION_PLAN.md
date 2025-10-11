# 117-Point SEO Production Implementation Plan
**Date:** October 11, 2025
**Status:** In Progress - Phase 1 Complete

---

## 🎯 Vision

**Production-ready 117-Point SEO Analysis System** that:
- ✅ Uses ONLY real, live data (no placeholders/mocks)
- ✅ Integrates with subscription tier limits
- ✅ Schedules automatically via task calendar
- ✅ Tracks usage and quota enforcement
- ✅ Provides enterprise-grade insights

---

## ✅ Phase 1: Foundation (COMPLETED)

### 1. SEMrush Removal
- ✅ Removed from [app/api/keywords/route.ts](app/api/keywords/route.ts)
- ✅ Removed SEMrushClient from [lib/api-clients.ts](lib/api-clients.ts)
- ✅ Disabled [services/api/semrush.ts](services/api/semrush.ts)

### 2. API Endpoint Created
- ✅ [app/api/audits/117-point/route.ts](app/api/audits/117-point/route.ts)
  - POST: Run comprehensive audit
  - GET: Fetch past audits
  - Saves results to `seo_audits` table

### 3. UI Dashboard Created
- ✅ [app/companies/[id]/comprehensive-audit/page.tsx](app/companies/[id]/comprehensive-audit/page.tsx)
  - Overall score display
  - Category breakdowns (5 categories)
  - Prioritized action plan
  - Real-time audit execution

### 4. Production Analyzer Started
- ✅ [lib/seo-117-point-production.ts](lib/seo-117-point-production.ts)
  - Framework with real data sources
  - Lighthouse integration
  - Firecrawl integration
  - Live HTML crawling
  - GSC/GMB optional integration

---

## 🚧 Phase 2: Real Data Implementation (IN PROGRESS)

### Task 1: Complete All 117 Checks

**Technical SEO (35 points)** - File: `lib/seo-117-point-production.ts`

```typescript
// Categories:
1. HTTPS & Security (5 points)
   - HTTPS enabled
   - Mixed content check
   - Security headers (CSP, X-Frame-Options, etc.)
   - SSL certificate validity
   - HSTS enabled

2. Performance (8 points)
   - Core Web Vitals (LCP, FID, CLS) from Lighthouse
   - Page load time
   - Time to Interactive (TTI)
   - Total Blocking Time (TBT)
   - First Contentful Paint (FCP)
   - Server response time
   - Resource compression
   - Image optimization

3. Crawlability (8 points)
   - Robots.txt present
   - XML sitemap present
   - XML sitemap valid
   - No broken links
   - Clean URL structure
   - No redirect chains
   - Canonical tags correct
   - No orphan pages

4. Mobile (7 points)
   - Mobile viewport configured
   - Mobile-friendly test pass (Lighthouse)
   - Touch targets adequate size
   - Font sizes readable
   - Content wider than screen
   - No horizontal scrolling
   - Mobile page speed

5. Structured Data (7 points)
   - Schema.org markup present
   - Schema validation passes
   - Breadcrumb markup
   - Organization markup
   - Local business markup (if applicable)
   - Article markup (if applicable)
   - Product markup (if applicable)
```

**On-Page SEO (28 points)**

```typescript
1. Meta Tags (8 points)
   - Title tag present
   - Title tag length (50-60 chars)
   - Meta description present
   - Meta description length (120-160 chars)
   - Unique title per page
   - Keywords in title
   - Keywords in meta description
   - No duplicate meta tags

2. Heading Structure (6 points)
   - H1 tag present
   - Only one H1
   - H2-H6 hierarchy correct
   - Keywords in headings
   - Heading length appropriate
   - No heading skipping (H1 → H3)

3. Content Optimization (6 points)
   - Keyword density 1-3%
   - LSI keywords present
   - Internal links present (3+ per page)
   - External authoritative links
   - Anchor text optimization
   - Content-to-HTML ratio >25%

4. Images (4 points)
   - All images have alt tags
   - Alt tags descriptive
   - Images optimized (WebP/AVIF)
   - Lazy loading implemented

5. Links (4 points)
   - Descriptive anchor text
   - No broken links
   - Follow/nofollow correct
   - Internal linking strategy
```

**Content Quality (22 points)**

```typescript
1. Length & Depth (5 points)
   - Word count 1000+ (blog posts)
   - Comprehensive topic coverage
   - Multiple sections/subtopics
   - Answers user intent
   - Original content (not duplicate)

2. Readability (5 points)
   - Reading level appropriate
   - Short paragraphs (<150 words)
   - Bullet points/lists used
   - Subheadings frequent
   - Multimedia breaks up text

3. E-E-A-T Signals (6 points)
   - Author credentials shown
   - Publication date visible
   - Last updated date shown
   - External citations/sources
   - Expert quotes included
   - Industry credentials mentioned

4. Engagement (6 points)
   - Clear CTA present
   - Internal links to related content
   - Social sharing buttons
   - Comments/discussion enabled
   - Video/images embedded
   - Interactive elements
```

**User Experience (15 points)**

```typescript
1. Core Web Vitals (5 points)
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1
   - INP < 200ms
   - TTFB < 600ms

2. Navigation (4 points)
   - Clear menu structure
   - Breadcrumbs present
   - Search functionality
   - Footer navigation

3. Design (3 points)
   - Sufficient color contrast
   - Readable font sizes (16px+)
   - No intrusive popups

4. Accessibility (3 points)
   - ARIA labels where needed
   - Keyboard navigation works
   - Screen reader compatible
```

**Local SEO (17 points)**

```typescript
1. NAP Consistency (4 points)
   - Name consistent across web
   - Address consistent
   - Phone consistent
   - NAP in footer/header

2. Google Business Profile (5 points)
   - GBP claimed and verified
   - Profile 100% complete
   - Recent photos uploaded
   - Posts published weekly
   - Reviews responded to

3. Local Signals (4 points)
   - City/state in title tags
   - Local schema markup
   - Embedded Google Map
   - Local keywords used

4. Citations (4 points)
   - Listed in top directories
   - NAP consistent in directories
   - Industry-specific directories
   - Local backlinks present
```

---

### Task 2: Integrate Subscription Tiers

**Update Schema:** `database/client-subscriptions-schema.sql`

```sql
-- Add 117-point audit quotas to tiers
ALTER TABLE subscription_tiers ADD COLUMN comprehensive_audits_per_month INTEGER DEFAULT 0;

-- Update existing tiers
UPDATE subscription_tiers SET comprehensive_audits_per_month = 1 WHERE name = 'starter';  -- $500/mo
UPDATE subscription_tiers SET comprehensive_audits_per_month = 2 WHERE name = 'growth';   -- $1,000/mo
UPDATE subscription_tiers SET comprehensive_audits_per_month = 4 WHERE name = 'scale';    -- $2,500/mo
UPDATE subscription_tiers SET comprehensive_audits_per_month = 8 WHERE name = 'empire';   -- $5,000/mo

-- Add quota tracking to subscriptions
ALTER TABLE client_subscriptions ADD COLUMN comprehensive_audits_quota INTEGER DEFAULT 0;
ALTER TABLE client_subscriptions ADD COLUMN comprehensive_audits_used INTEGER DEFAULT 0;

-- Update trigger to reset comprehensive audit usage
-- (Modify existing reset_monthly_quotas trigger)
```

**API Tier Enforcement:** `app/api/audits/117-point/route.ts`

```typescript
// Before running audit, check quota
const subscription = await supabase
  .from('client_subscriptions')
  .select('comprehensive_audits_quota, comprehensive_audits_used')
  .eq('company_id', companyId)
  .eq('status', 'active')
  .single();

if (!subscription.data) {
  return NextResponse.json({
    error: 'No active subscription found',
    upgrade_required: true,
  }, { status: 403 });
}

if (subscription.data.comprehensive_audits_used >= subscription.data.comprehensive_audits_quota) {
  return NextResponse.json({
    error: 'Monthly quota exceeded',
    quota: subscription.data.comprehensive_audits_quota,
    used: subscription.data.comprehensive_audits_used,
    upgrade_required: true,
  }, { status: 429 });
}

// After successful audit, increment counter
await supabase
  .from('client_subscriptions')
  .update({ comprehensive_audits_used: subscription.data.comprehensive_audits_used + 1 })
  .eq('company_id', companyId);
```

---

### Task 3: Calendar Integration

**Add to Task Types:** `task_execution_calendar` table already supports this!

```typescript
// Schedule 117-point audit via calendar
await supabase.from('task_execution_calendar').insert({
  subscription_id: subscription.id,
  company_id: company.id,
  scheduled_date: '2025-10-15',
  scheduled_time: '09:00:00',
  task_type: '117_point_audit',  // NEW TASK TYPE
  task_category: 'seo',
  priority: 'high',
  task_config: JSON.stringify({
    url: company.website,
    include_local_seo: true,
    target_keywords: ['keyword1', 'keyword2'],
  }),
  status: 'scheduled',
});
```

**Scheduler Service:** `services/scheduler/117-point-scheduler.ts` (NEW FILE)

```typescript
import cron from 'node-cron';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { Production117PointAnalyzer } from '@/lib/seo-117-point-production';

export function start117PointScheduler() {
  // Run every hour, check for pending 117-point audits
  cron.schedule('0 * * * *', async () => {
    console.log('[117-Point Scheduler] Checking for scheduled audits...');

    const supabase = createAdminClient();
    const now = new Date();

    // Get pending audits scheduled for now
    const { data: tasks } = await supabase
      .from('task_execution_calendar')
      .select('*, client_subscriptions(*)')
      .eq('task_type', '117_point_audit')
      .eq('status', 'scheduled')
      .lte('scheduled_date', now.toISOString().split('T')[0])
      .lte('scheduled_time', now.toTimeString().split(' ')[0]);

    for (const task of tasks || []) {
      await execute117PointAudit(task);
    }
  });
}

async function execute117PointAudit(task: any) {
  const supabase = createAdminClient();

  try {
    // Mark as executing
    await supabase
      .from('task_execution_calendar')
      .update({
        status: 'executing',
        execution_started_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    // Run the audit
    const analyzer = new Production117PointAnalyzer();
    const config = JSON.parse(task.task_config);

    const result = await analyzer.analyzeWebsite(config.url, {
      includeLocalSEO: config.include_local_seo,
      targetKeywords: config.target_keywords,
    });

    // Save results
    await supabase.from('seo_audits').insert({
      company_id: task.company_id,
      url: config.url,
      overall_score: result.overallScore,
      metadata: {
        type: '117-point-scheduled',
        category_scores: result.categoryScores,
        ...result,
      },
    });

    // Mark complete
    await supabase
      .from('task_execution_calendar')
      .update({
        status: 'completed',
        execution_completed_at: new Date().toISOString(),
        result_summary: JSON.stringify({
          overall_score: result.overallScore,
          categories: result.categoryScores,
        }),
      })
      .eq('id', task.id);

  } catch (error: any) {
    console.error('[117-Point Scheduler] Audit failed:', error);

    await supabase
      .from('task_execution_calendar')
      .update({
        status: 'failed',
        result_summary: JSON.stringify({ error: error.message }),
      })
      .eq('id', task.id);
  }
}
```

---

### Task 4: UI Enhancements

**Add Scheduling UI:** `app/companies/[id]/comprehensive-audit/page.tsx`

```typescript
// Add "Schedule Audit" button
<button
  onClick={() => setShowScheduleModal(true)}
  className="px-4 py-2 border border-emerald-600 text-emerald-600..."
>
  <Calendar className="w-4 h-4" />
  Schedule Monthly Audits
</button>

// Modal to schedule recurring audits
<ScheduleAuditModal
  companyId={companyId}
  subscription={subscription}
  onSchedule={handleSchedule}
/>
```

**Show Quota Usage:**

```typescript
// Display quota badge
{subscription && (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-gray-600">
      {subscription.comprehensive_audits_used} / {subscription.comprehensive_audits_quota}
    </span>
    <span className="text-gray-400">audits this month</span>
  </div>
)}

// Upgrade prompt when quota exceeded
{quotaExceeded && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h4 className="font-semibold text-yellow-900">Monthly Quota Reached</h4>
    <p className="text-sm text-yellow-800 mt-1">
      You've used all {subscription.comprehensive_audits_quota} comprehensive audits for this month.
    </p>
    <button className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg">
      Upgrade Plan
    </button>
  </div>
)}
```

---

## 📊 Implementation Timeline

### Week 1: Core Analyzer
- [ ] Day 1-2: Complete all 35 technical checks (real data)
- [ ] Day 3: Complete all 28 on-page checks
- [ ] Day 4: Complete all 22 content checks
- [ ] Day 5: Complete all 15 UX checks + 17 local SEO checks

### Week 2: Integration
- [ ] Day 6: Update subscription schema with 117-point quotas
- [ ] Day 7: Add tier enforcement to API
- [ ] Day 8: Create scheduler service
- [ ] Day 9: Build scheduling UI
- [ ] Day 10: End-to-end testing

---

## 🎯 Success Criteria

1. ✅ **No Placeholders:** Every check uses real, live data
2. ✅ **Tier-Gated:** Quota enforcement working correctly
3. ✅ **Scheduled Execution:** Cron job runs audits automatically
4. ✅ **Usage Tracking:** Quotas reset monthly, usage increments correctly
5. ✅ **UI Complete:** Users can trigger manual audits + schedule recurring ones
6. ✅ **Data Quality:** All 117 points provide actionable insights

---

## 💰 Pricing Model

| Tier | Monthly Price | Basic Audits | 117-Point Audits | Value Prop |
|------|--------------|--------------|------------------|------------|
| **Starter** | $500 | 2 | 1 | Try comprehensive insights |
| **Growth** | $1,000 | 4 | 2 | Monthly deep analysis |
| **Scale** | $2,500 | 8 | 4 | Weekly comprehensive audits |
| **Empire** | $5,000 | 16 | 8 | 2x per week enterprise analysis |

**Competitive Advantage:**
- Ahrefs Site Audit: $199/mo (limited checks)
- Our 117-Point System: Included in subscription (117 checks)
- **Savings:** $199/mo per client
- **Features:** More comprehensive than Ahrefs

---

## 🔧 Next Steps (Immediate)

1. **Complete Analyzer** - Implement remaining 100+ checks in `seo-117-point-production.ts`
2. **Database Migration** - Add comprehensive_audits columns to subscription tables
3. **API Enforcement** - Add tier checking to 117-point endpoint
4. **Scheduler** - Create cron job service
5. **UI** - Add scheduling interface + quota display

---

*Last Updated: October 11, 2025*
*Status: Phase 1 Complete, Phase 2 In Progress*
