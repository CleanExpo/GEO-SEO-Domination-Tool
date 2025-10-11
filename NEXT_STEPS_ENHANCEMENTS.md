# 🚀 Next Steps After Enhancement Tables Deployment

**Status**: ✅ All 18 tables created successfully
**Date**: October 11, 2025

---

## 📋 Immediate Next Steps (In Priority Order)

### 1. ✅ Test Data Population (15 minutes)

Create sample data to verify table relationships work correctly.

**Create test script**:
```javascript
// scripts/populate-test-data.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateTestData() {
  // Get first company ID for testing
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .limit(1);

  if (!companies || companies.length === 0) {
    throw new Error('No companies found. Create a company first.');
  }

  const companyId = companies[0].id;

  // 1. Test competitor tracking
  const { data: competitor, error: compError } = await supabase
    .from('competitor_snapshots')
    .insert({
      company_id: companyId,
      competitor_name: 'Test Competitor A',
      competitor_website: 'https://competitor-a.com',
      visibility_score: 85.5,
      domain_authority: 65,
      backlink_count: 1200,
      review_count: 150,
      avg_rating: 4.7
    })
    .select();

  console.log('✅ Competitor snapshot:', competitor);

  // 2. Test SEO trends
  const { data: trend, error: trendError } = await supabase
    .from('seo_trends')
    .insert({
      company_id: companyId,
      metric_name: 'organic_traffic',
      metric_category: 'traffic',
      metric_value: 15000,
      metric_unit: 'count',
      previous_value: 12000,
      change_amount: 3000,
      change_percentage: 25.0
    })
    .select();

  console.log('✅ SEO trend:', trend);

  // 3. Test ranking history
  const { data: ranking, error: rankError } = await supabase
    .from('ranking_history')
    .insert({
      company_id: companyId,
      keyword_text: 'local seo services',
      location: 'Brisbane, QLD',
      rank_position: 5,
      rank_url: 'https://example.com/services',
      rank_type: 'organic',
      in_local_pack: false,
      search_volume: 8100
    })
    .select();

  console.log('✅ Ranking history:', ranking);

  // 4. Test client portal access
  const { data: portal, error: portalError } = await supabase
    .from('client_portal_access')
    .insert({
      company_id: companyId,
      access_token: 'test_token_' + Math.random().toString(36).substring(7),
      token_type: 'portal',
      allowed_sections: ['reports', 'analytics', 'notifications'],
      invitation_email: 'client@example.com',
      is_active: true
    })
    .select();

  console.log('✅ Client portal access:', portal);

  // 5. Test API quota
  const { data: organisations } = await supabase
    .from('organisations')
    .select('id')
    .limit(1);

  if (organisations && organisations.length > 0) {
    const { data: quota, error: quotaError } = await supabase
      .from('api_quotas')
      .insert({
        organisation_id: organisations[0].id,
        quota_type: 'api_calls',
        max_quota_per_month: 10000,
        current_month_usage: 150,
        quota_status: 'active'
      })
      .select();

    console.log('✅ API quota:', quota);
  }

  console.log('\n✅ All test data inserted successfully!');
}

populateTestData().catch(console.error);
```

**Run it**:
```bash
node scripts/populate-test-data.mjs
```

---

### 2. 🔌 API Endpoints (2 hours)

Build REST API endpoints to interact with the new tables.

**Priority Endpoints**:

#### A. Competitor Tracking API
**File**: `app/api/analytics/competitors/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { company_id, competitor_name, metrics } = body;

  const { data, error } = await supabase
    .from('competitor_snapshots')
    .insert({
      company_id,
      competitor_name,
      competitor_website: metrics.website,
      visibility_score: metrics.visibility_score,
      domain_authority: metrics.domain_authority,
      backlink_count: metrics.backlink_count,
      review_count: metrics.review_count,
      avg_rating: metrics.avg_rating
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json(
      { error: 'company_id is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('competitor_snapshots')
    .select('*')
    .eq('company_id', companyId)
    .order('snapshot_date', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ competitors: data });
}
```

#### B. SEO Trends API
**File**: `app/api/analytics/trends/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const metricName = searchParams.get('metric_name');
  const days = parseInt(searchParams.get('days') || '30');

  if (!companyId) {
    return NextResponse.json(
      { error: 'company_id is required' },
      { status: 400 }
    );
  }

  let query = supabase
    .from('seo_trends')
    .select('*')
    .eq('company_id', companyId)
    .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('recorded_at', { ascending: true });

  if (metricName) {
    query = query.eq('metric_name', metricName);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trends: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();

  const { data, error } = await supabase
    .from('seo_trends')
    .insert(body)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
```

#### C. Client Portal Reports API
**File**: `app/api/client-portal/reports/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify portal access token
  const { data: access, error: accessError } = await supabase
    .from('client_portal_access')
    .select('*')
    .eq('access_token', token)
    .eq('is_active', true)
    .single();

  if (accessError || !access) {
    return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
  }

  // Fetch reports for this company
  const { data: reports, error: reportsError } = await supabase
    .from('client_reports')
    .select('*')
    .eq('company_id', companyId || access.company_id)
    .eq('report_status', 'published')
    .order('published_at', { ascending: false });

  if (reportsError) {
    return NextResponse.json({ error: reportsError.message }, { status: 500 });
  }

  return NextResponse.json({ reports });
}
```

#### D. Rate Limiting Middleware
**File**: `app/api/middleware/rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function checkRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `${ip}:${endpoint}`;

  // Check if rate limit exists
  const { data: rateLimit, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('rate_limit_key', rateLimitKey)
    .single();

  const now = new Date();

  // If no rate limit exists, create one
  if (!rateLimit) {
    await supabase.from('rate_limits').insert({
      ip_address: ip,
      rate_limit_key: rateLimitKey,
      endpoint_pattern: endpoint,
      max_requests_per_minute: 60,
      max_requests_per_hour: 1000,
      max_requests_per_day: 10000,
      current_minute_count: 1,
      minute_window_start: now
    });

    return { allowed: true, remaining: 59, resetAt: new Date(now.getTime() + 60000) };
  }

  // Check minute window
  const minuteWindowStart = new Date(rateLimit.minute_window_start);
  const minuteElapsed = (now.getTime() - minuteWindowStart.getTime()) / 1000;

  if (minuteElapsed > 60) {
    // Reset minute counter
    await supabase
      .from('rate_limits')
      .update({
        current_minute_count: 1,
        minute_window_start: now
      })
      .eq('id', rateLimit.id);

    return {
      allowed: true,
      remaining: rateLimit.max_requests_per_minute - 1,
      resetAt: new Date(now.getTime() + 60000)
    };
  }

  // Check if limit exceeded
  if (rateLimit.current_minute_count >= rateLimit.max_requests_per_minute) {
    await supabase
      .from('rate_limits')
      .update({
        total_exceeded_count: rateLimit.total_exceeded_count + 1,
        last_exceeded_at: now
      })
      .eq('id', rateLimit.id);

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(minuteWindowStart.getTime() + 60000)
    };
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .update({
      current_minute_count: rateLimit.current_minute_count + 1
    })
    .eq('id', rateLimit.id);

  return {
    allowed: true,
    remaining: rateLimit.max_requests_per_minute - rateLimit.current_minute_count - 1,
    resetAt: new Date(minuteWindowStart.getTime() + 60000)
  };
}
```

---

### 3. 🤖 Background Jobs (1 hour)

Configure scheduled jobs to populate data automatically.

**File**: `services/scheduler/enhancement-jobs.ts`

```typescript
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Daily competitor tracking
export const competitorTrackingJob = cron.schedule(
  '0 2 * * *', // 2 AM daily
  async () => {
    console.log('🔍 Running competitor tracking...');

    const { data: companies } = await supabase
      .from('companies')
      .select('id, website');

    for (const company of companies || []) {
      // TODO: Scrape competitor data using Firecrawl/SEMrush
      // For now, just log
      console.log(`Tracking competitors for ${company.website}`);
    }
  },
  { scheduled: false }
);

// Hourly SEO trend recording
export const seoTrendJob = cron.schedule(
  '0 * * * *', // Every hour
  async () => {
    console.log('📊 Recording SEO trends...');

    const { data: companies } = await supabase
      .from('companies')
      .select('id, website');

    for (const company of companies || []) {
      // TODO: Fetch metrics from Google Analytics/Search Console
      console.log(`Recording trends for ${company.website}`);
    }
  },
  { scheduled: false }
);

// Weekly ranking checks
export const rankingCheckJob = cron.schedule(
  '0 3 * * 1', // 3 AM every Monday
  async () => {
    console.log('🎯 Checking keyword rankings...');

    const { data: keywords } = await supabase
      .from('keywords')
      .select('*, companies(website)');

    for (const keyword of keywords || []) {
      // TODO: Check rankings using SerpAPI
      console.log(`Checking ranking for "${keyword.keyword_text}"`);
    }
  },
  { scheduled: false }
);

// Start all jobs
export function startEnhancementJobs() {
  competitorTrackingJob.start();
  seoTrendJob.start();
  rankingCheckJob.start();
  console.log('✅ Enhancement background jobs started');
}

// Stop all jobs
export function stopEnhancementJobs() {
  competitorTrackingJob.stop();
  seoTrendJob.stop();
  rankingCheckJob.stop();
  console.log('⏸️  Enhancement background jobs stopped');
}
```

**Register in main scheduler**:
```typescript
// services/scheduler/index.ts
import { startEnhancementJobs } from './enhancement-jobs';

export function startAllJobs() {
  // Existing jobs...
  startEnhancementJobs();
}
```

---

### 4. 🎨 UI Components (3 hours)

Build React components to display the new data.

#### A. Competitor Tracking Dashboard
**File**: `app/components/analytics/CompetitorTracker.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface Competitor {
  id: string;
  competitor_name: string;
  visibility_score: number;
  domain_authority: number;
  backlink_count: number;
  review_count: number;
  avg_rating: number;
  snapshot_date: string;
}

export default function CompetitorTracker({ companyId }: { companyId: string }) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/competitors?company_id=${companyId}`)
      .then(res => res.json())
      .then(data => {
        setCompetitors(data.competitors || []);
        setLoading(false);
      });
  }, [companyId]);

  if (loading) return <div>Loading competitors...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Competitor Tracking</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map(competitor => (
          <div key={competitor.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">{competitor.competitor_name}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Visibility Score:</span>
                <span className="font-semibold">{competitor.visibility_score}/100</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Domain Authority:</span>
                <span className="font-semibold">{competitor.domain_authority}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Backlinks:</span>
                <span className="font-semibold">{competitor.backlink_count?.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Reviews:</span>
                <span className="font-semibold">
                  {competitor.review_count} ({competitor.avg_rating}★)
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Last checked: {new Date(competitor.snapshot_date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### B. SEO Trends Chart
**File**: `app/components/analytics/SEOTrendsChart.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Trend {
  id: string;
  metric_name: string;
  metric_value: number;
  recorded_at: string;
}

export default function SEOTrendsChart({ companyId, metricName }: { companyId: string; metricName: string }) {
  const [trends, setTrends] = useState<Trend[]>([]);

  useEffect(() => {
    fetch(`/api/analytics/trends?company_id=${companyId}&metric_name=${metricName}&days=30`)
      .then(res => res.json())
      .then(data => setTrends(data.trends || []));
  }, [companyId, metricName]);

  const chartData = trends.map(trend => ({
    date: new Date(trend.recorded_at).toLocaleDateString(),
    value: trend.metric_value
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-lg mb-4">{metricName.replace(/_/g, ' ').toUpperCase()}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 📝 Testing Checklist

After implementing each section:

- [ ] Test data inserted successfully
- [ ] API endpoints return 200 status
- [ ] Rate limiting blocks excessive requests
- [ ] Background jobs run without errors
- [ ] UI components display data correctly
- [ ] Error handling works for invalid inputs
- [ ] Authorization checks prevent unauthorized access

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot read properties of undefined"
**Solution**: Add null checks in UI components before mapping data

### Issue: Rate limit always returns "exceeded"
**Solution**: Check `minute_window_start` timestamp - may need to reset manually

### Issue: Background job doesn't run
**Solution**: Verify `scheduled: false` removed and `.start()` called explicitly

### Issue: Client portal returns 401
**Solution**: Check `access_token` is passed in `Authorization: Bearer {token}` header

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Recharts Library**: https://recharts.org/en-US/
- **node-cron**: https://github.com/node-cron/node-cron

---

**Ready to begin implementation! 🚀**

Choose which section to start with and let me know if you need help building any of these components.
