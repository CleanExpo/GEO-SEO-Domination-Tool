# Tier Automation Architecture
## 100% AI-Driven Autonomous System

**Date:** 2025-10-12
**Status:** Design Complete, Implementation Starting
**Goal:** Complete autonomous tier-based automation from signup to AI execution

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIER AUTOMATION SYSTEM                              │
│                    (100% Autonomous AI Execution)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
         ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
         │  CLIENT PORTAL   │  │   AI CORE   │  │  ADMIN PORTAL   │
         │  (Public)        │  │  (Internal) │  │  (Admin Only)   │
         └─────────────────┘  └─────────────┘  └─────────────────┘
                │                    │                   │
                │                    │                   │
    ┌───────────┼────────────────────┼───────────────────┼──────────────┐
    │           │                    │                   │              │
    ▼           ▼                    ▼                   ▼              ▼
┌────────┐  ┌────────┐      ┌────────────┐      ┌────────────┐  ┌──────────┐
│ Signup │  │ Stripe │      │   Agents   │      │ Monitoring │  │ Webhooks │
│  Flow  │  │Payment │      │ (7 Active) │      │ Dashboard  │  │  System  │
└────────┘  └────────┘      └────────────┘      └────────────┘  └──────────┘
    │           │                    │                   │              │
    │           └────────────────────┼───────────────────┘              │
    │                                │                                  │
    └────────────────────────────────┼──────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │      POSTGRESQL DATABASE        │
                    │  - Subscriptions                │
                    │  - Tier Enforcement             │
                    │  - Agent Execution Logs         │
                    │  - Approval Workflows           │
                    └─────────────────────────────────┘
```

---

## 1. Tier Strategy Definition

### Good Tier ($299/mo + GST)
**Automation Level:** Manual with AI Recommendations
**Target:** Small businesses, startups, testing phase

**AI Behavior:**
- AI agents analyze and provide recommendations
- **Human approval required** before ANY execution
- Manual trigger for all tasks
- Weekly email reports with suggestions

**Workflow:**
```
Task Created → AI Analysis → Recommendation Report →
→ [HUMAN APPROVAL] → Manual Execution → Results Logged
```

**Features:**
- 1 website
- Monthly audits (manual trigger)
- 50 keywords tracked
- 2 competitors monitored
- AI recommendations (no auto-execution)
- Email support

---

### Better Tier ($449/mo + GST) - **MOST POPULAR**
**Automation Level:** Semi-Autonomous
**Target:** Growing businesses, agencies with multiple clients

**AI Behavior:**
- AI agents **autonomously execute** scheduled tasks
- **Approval required** only for content publishing
- Scheduled audits, keyword updates, backlink checks run automatically
- AI publishes content to staging, human approves for production

**Workflow:**
```
Scheduled Task → AI Execution → Auto-Save to DB →
→ If (content publish) → [HUMAN APPROVAL] → Publish
→ Else → Auto-Complete → Notify User
```

**Features:**
- 5 websites
- Weekly audits (auto-scheduled)
- 500 keywords tracked
- 10 competitors monitored
- AI auto-execution (non-publishing tasks)
- AI content generation (requires approval for publishing)
- Priority email + 24/7 chat support
- Dedicated account manager

---

### Best Tier ($599/mo + GST)
**Automation Level:** Full Autopilot
**Target:** Enterprises, agencies managing 10+ clients

**AI Behavior:**
- **Complete AI autonomy** - zero human intervention
- AI swarm coordination across all tasks
- Auto-publishing to production (no approval)
- Self-healing error recovery
- Autonomous optimization loops

**Workflow:**
```
Scheduled Task → AI Swarm Coordination → Auto-Execution →
→ Auto-Publish to Production → Real-Time Monitoring →
→ If (error) → Self-Healing → Retry → Success
```

**Features:**
- Unlimited websites
- Daily audits (auto-scheduled)
- Unlimited keywords
- Unlimited competitors
- Full AI autopilot (zero approval)
- AI swarm coordination (7 agents working together)
- Auto-publishing to production
- White-glove onboarding
- Dedicated success team
- Custom integrations

---

### Custom Tier (Contact Sales)
**Automation Level:** Fully Customizable
**Target:** Enterprise clients with specific requirements

**AI Behavior:**
- Custom approval workflows
- Custom AI models
- White-label deployment
- Custom integrations
- API access for external systems

**Features:**
- Custom everything
- Dedicated infrastructure
- SLA guarantees
- Custom development

---

## 2. Complete Autonomous Flow

### 2.1 Signup Flow (100% Automated)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SIGNUP FLOW                                   │
└──────────────────────────────────────────────────────────────────────┘

Step 1: User visits /pricing
        └─> Selects tier (Good/Better/Best/Custom)

Step 2: Redirect to /signup?tier={selected}
        └─> Pre-filled tier selection
        └─> Form fields:
            - Business Name *
            - Email *
            - Website URL *
            - Phone (optional)
            - Company Size (dropdown)
            - Industry (dropdown)

Step 3: Click "Continue to Payment"
        └─> POST /api/onboarding/create-client
            └─> Creates client record (status: 'pending_payment')
            └─> Returns clientId

Step 4: Stripe Checkout Session
        └─> POST /api/payments/create-checkout-session
            └─> Creates Stripe session with tier pricing
            └─> Metadata: { clientId, tier, billingCycle }
            └─> Redirect to Stripe Checkout

Step 5: User completes payment on Stripe
        └─> Stripe sends webhook to /api/webhooks/stripe

Step 6: Webhook Processing (AUTONOMOUS)
        └─> Verify signature
        └─> Event: checkout.session.completed
            └─> Update client: status = 'active'
            └─> Create subscription record
            └─> Grant tier access
            └─> Trigger onboarding automation

Step 7: Onboarding Automation (AUTONOMOUS)
        └─> Send welcome email with credentials setup link
        └─> Create initial company profile
        └─> Schedule first audit (based on tier)
        └─> Initialize AI agents (based on tier)

Step 8: User Dashboard Access
        └─> Redirect to /dashboard
        └─> Show credential setup wizard
        └─> Begin tier-specific automation
```

---

### 2.2 Credential Management Flow (100% Automated)

```
┌──────────────────────────────────────────────────────────────────────┐
│                   CREDENTIAL MANAGEMENT FLOW                         │
└──────────────────────────────────────────────────────────────────────┘

Step 1: User clicks "Connect Platform" (e.g., Google Ads)
        └─> Modal opens with OAuth or API key input

Step 2: OAuth Flow (for supported platforms)
        └─> Redirect to platform OAuth
        └─> Platform redirects back with authorization code
        └─> POST /api/integrations/oauth/callback
            └─> Exchange code for access token
            └─> Encrypt token with AES-256-GCM
            └─> Store in client_credentials table
            └─> Log to credential_access_log

Step 3: API Key Flow (for API-only platforms)
        └─> User pastes API key in modal
        └─> POST /api/onboarding/credentials
            └─> Sanitize input
            └─> Validate format
            └─> Encrypt with AES-256-GCM
            └─> Store in client_credentials table

Step 4: Credential Verification (AUTONOMOUS)
        └─> AI agent attempts test API call
        └─> If success: mark as 'verified'
        └─> If failure: notify user with error details

Step 5: Credential Usage (AUTONOMOUS)
        └─> AI agents retrieve encrypted credentials
        └─> Decrypt in memory (never log plaintext)
        └─> Execute API calls
        └─> Log access to credential_access_log
        └─> Update last_used_at timestamp
```

**Security Architecture:**
```typescript
// Encryption (lib/encryption.ts)
encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

decrypt(ciphertext: string): string {
  const [iv, authTag, encrypted] = ciphertext.split(':').map(h => Buffer.from(h, 'hex'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
```

---

### 2.3 AI Agent Orchestration (Tier-Based)

```
┌──────────────────────────────────────────────────────────────────────┐
│                   AI AGENT ORCHESTRATION                             │
└──────────────────────────────────────────────────────────────────────┘

AGENT REGISTRY (7 Production-Ready Agents):
├─ 1. SEO Audit Agent
│   └─ Triggers: Scheduled (monthly/weekly/daily based on tier)
│   └─ Actions: Lighthouse audit, E-E-A-T score, recommendations
│   └─ Approval: Good (required), Better/Best (none)
│
├─ 2. Keyword Tracker Agent
│   └─ Triggers: Daily ranking check
│   └─ Actions: Query rankings, update DB, detect changes
│   └─ Approval: None (all tiers)
│
├─ 3. Competitor Monitor Agent
│   └─ Triggers: Weekly competitor scan
│   └─> Actions: Analyze competitor keywords, backlinks, content
│   └─ Approval: None (all tiers)
│
├─ 4. Backlink Analyzer Agent
│   └─ Triggers: Weekly backlink check
│   └─ Actions: Crawl backlinks, detect new/lost links
│   └─ Approval: None (all tiers)
│
├─ 5. Content Generator Agent
│   └─ Triggers: User request or automated (Better/Best only)
│   └─ Actions: Generate blog posts, meta descriptions
│   └─ Approval: Good/Better (required), Best (none)
│
├─ 6. Local Pack Monitor Agent
│   └─ Triggers: Daily local ranking check
│   └─ Actions: Track GBP ranking, citations, reviews
│   └─ Approval: None (all tiers)
│
└─ 7. AI Search Visibility Agent
    └─ Triggers: Daily AI search check
    └─ Actions: Query Claude/ChatGPT/Perplexity, track mentions
    └─ Approval: None (all tiers)


TIER-BASED EXECUTION LOGIC:

┌─────────────────────────────────────────────────────────────────────┐
│  GOOD TIER ($299/mo) - Manual Approval Required                    │
└─────────────────────────────────────────────────────────────────────┘

Task: SEO Audit
├─ Scheduled: Monthly (1st of month)
├─ AI Agent: SEO Audit Agent
├─ Execution:
│   1. Cron job triggers task
│   2. AI agent analyzes website
│   3. Generate report with recommendations
│   4. Create approval_tasks record (status: 'pending')
│   5. Send email: "Review your SEO audit recommendations"
│   6. User clicks "Approve" in dashboard
│   7. AI agent executes approved tasks
│   8. Update approval_tasks (status: 'approved')
│   9. Send email: "Tasks completed successfully"
│
└─ Database Flow:
    INSERT INTO approval_tasks (
      client_id, task_type, recommendations, status
    ) VALUES (?, 'seo_audit', ?, 'pending');

    -- User approves --

    UPDATE approval_tasks SET status = 'approved' WHERE id = ?;
    -- AI executes tasks --


┌─────────────────────────────────────────────────────────────────────┐
│  BETTER TIER ($449/mo) - Semi-Autonomous (Approval for Publishing)  │
└─────────────────────────────────────────────────────────────────────┘

Task: SEO Audit (Non-Publishing)
├─ Scheduled: Weekly (every Monday)
├─ AI Agent: SEO Audit Agent
├─ Execution:
│   1. Cron job triggers task
│   2. AI agent analyzes website
│   3. AI executes tasks (no approval needed)
│   4. Update database automatically
│   5. Send email: "Weekly audit complete - view results"
│
└─ No approval workflow (autonomous execution)

Task: Content Publishing (Publishing)
├─ Scheduled: Weekly content generation
├─ AI Agent: Content Generator Agent
├─ Execution:
│   1. AI generates blog post
│   2. Save to staging (auto)
│   3. Create approval_tasks record (status: 'pending_publish')
│   4. Send email: "New content ready for review"
│   5. User clicks "Approve & Publish"
│   6. AI publishes to production
│   7. Update approval_tasks (status: 'published')
│
└─ Database Flow:
    INSERT INTO approval_tasks (
      client_id, task_type, content_draft, status
    ) VALUES (?, 'content_publish', ?, 'pending_publish');

    -- User approves --

    UPDATE approval_tasks SET status = 'published' WHERE id = ?;
    -- AI publishes to production --


┌─────────────────────────────────────────────────────────────────────┐
│  BEST TIER ($599/mo) - Full Autopilot (Zero Approval)               │
└─────────────────────────────────────────────────────────────────────┘

Task: Everything (Including Publishing)
├─ Scheduled: Daily audits, weekly content, real-time monitoring
├─ AI Agents: All 7 agents (swarm coordination)
├─ Execution:
│   1. Cron job triggers task
│   2. AI swarm analyzes (multiple agents in parallel)
│   3. AI executes all tasks (no approval)
│   4. AI publishes to production (no approval)
│   5. Update database automatically
│   6. Real-time monitoring dashboard
│   7. Send email: "Daily automation summary"
│
└─ No approval workflow (complete autonomy)
```

---

## 3. Database Schema

### 3.1 Subscriptions & Payments

```sql
-- database/subscriptions-schema.sql

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id),
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best', 'custom')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'paused')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  client_id TEXT NOT NULL REFERENCES client_onboarding(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  payment_method TEXT, -- card, bank_transfer, etc.
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stripe customer mapping
CREATE TABLE IF NOT EXISTS stripe_customers (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE REFERENCES client_onboarding(id),
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier access control
CREATE TABLE IF NOT EXISTS tier_access (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE REFERENCES client_onboarding(id),
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best', 'custom')),
  features JSONB NOT NULL, -- { "websites": 1, "audits_per_month": 1, "keywords": 50 }
  automation_level TEXT NOT NULL, -- 'manual', 'semi_autonomous', 'full_autopilot'
  approval_required BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP -- NULL for active subscriptions
);

-- Approval tasks (for Good & Better tiers)
CREATE TABLE IF NOT EXISTS approval_tasks (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id),
  task_type TEXT NOT NULL, -- 'seo_audit', 'content_publish', 'backlink_analysis'
  task_data JSONB NOT NULL, -- Task details, recommendations, content draft
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approval_required_by TIMESTAMP, -- Deadline for approval
  approved_by TEXT, -- User who approved
  approved_at TIMESTAMP,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent execution logs
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client_onboarding(id),
  agent_name TEXT NOT NULL, -- 'SEO Audit Agent', 'Keyword Tracker'
  task_type TEXT NOT NULL,
  execution_mode TEXT NOT NULL, -- 'manual', 'semi_autonomous', 'full_autopilot'
  approval_required BOOLEAN,
  approval_task_id TEXT REFERENCES approval_tasks(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  execution_time_ms INTEGER,
  results JSONB, -- Execution results
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook events (for Stripe webhooks)
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'checkout.session.completed', 'invoice.paid'
  stripe_event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_stripe_customers_client ON stripe_customers(client_id);
CREATE INDEX idx_tier_access_client ON tier_access(client_id);
CREATE INDEX idx_approval_tasks_client_status ON approval_tasks(client_id, status);
CREATE INDEX idx_agent_logs_client_status ON agent_execution_logs(client_id, status);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, created_at);
```

---

## 4. API Endpoints

### 4.1 Payment & Subscription APIs

```typescript
// app/api/payments/create-checkout-session/route.ts
POST /api/payments/create-checkout-session
Body: {
  clientId: string;
  tier: 'good' | 'better' | 'best';
  billingCycle: 'monthly' | 'annual';
}
Response: {
  sessionId: string; // Stripe checkout session ID
  url: string; // Redirect URL
}

// app/api/webhooks/stripe/route.ts
POST /api/webhooks/stripe
Headers: { 'stripe-signature': string }
Body: Stripe Event Object
Response: { received: true }

// app/api/subscriptions/route.ts
GET /api/subscriptions?clientId={id}
Response: {
  subscription: {
    id: string;
    tier: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  tierAccess: {
    features: object;
    automationLevel: string;
  };
}

// app/api/subscriptions/cancel/route.ts
POST /api/subscriptions/cancel
Body: { clientId: string }
Response: { success: boolean; message: string }

// app/api/subscriptions/update/route.ts
POST /api/subscriptions/update
Body: {
  clientId: string;
  newTier: 'good' | 'better' | 'best';
}
Response: { success: boolean; subscriptionId: string }
```

### 4.2 Tier Enforcement APIs

```typescript
// app/api/tier/check-access/route.ts
POST /api/tier/check-access
Body: {
  clientId: string;
  feature: string; // 'seo_audit', 'unlimited_keywords', 'ai_autopilot'
}
Response: {
  allowed: boolean;
  reason?: string; // "Upgrade to Better tier to unlock this feature"
  upgradeRequired?: 'good' | 'better' | 'best';
}

// app/api/tier/usage/route.ts
GET /api/tier/usage?clientId={id}
Response: {
  tier: 'good' | 'better' | 'best';
  usage: {
    websites: { used: 1, limit: 1 };
    keywords: { used: 45, limit: 50 };
    auditsThisMonth: { used: 1, limit: 1 };
  };
  approaching_limits: string[]; // ['keywords']
}
```

### 4.3 Approval Workflow APIs

```typescript
// app/api/approvals/pending/route.ts
GET /api/approvals/pending?clientId={id}
Response: {
  pendingTasks: [
    {
      id: string;
      taskType: 'seo_audit' | 'content_publish';
      taskData: object;
      createdAt: string;
      approvalRequiredBy: string;
    }
  ];
}

// app/api/approvals/approve/route.ts
POST /api/approvals/approve
Body: {
  approvalTaskId: string;
  clientId: string;
}
Response: {
  success: boolean;
  executionStarted: boolean;
}

// app/api/approvals/reject/route.ts
POST /api/approvals/reject
Body: {
  approvalTaskId: string;
  clientId: string;
  reason: string;
}
Response: { success: boolean }
```

---

## 5. Stripe Integration

### 5.1 Stripe Products & Prices Setup

```typescript
// scripts/stripe-setup.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function setupStripeProducts() {
  // Good Tier
  const goodProduct = await stripe.products.create({
    name: 'Good - SEO Automation',
    description: 'Manual AI recommendations, 1 website, 50 keywords',
    metadata: { tier: 'good', automationLevel: 'manual' }
  });

  const goodMonthly = await stripe.prices.create({
    product: goodProduct.id,
    unit_amount: 29900, // $299 AUD in cents
    currency: 'aud',
    recurring: { interval: 'month' },
    metadata: { tier: 'good', billingCycle: 'monthly' }
  });

  const goodAnnual = await stripe.prices.create({
    product: goodProduct.id,
    unit_amount: 299000, // $2990 AUD in cents (17% discount)
    currency: 'aud',
    recurring: { interval: 'year' },
    metadata: { tier: 'good', billingCycle: 'annual' }
  });

  // Better Tier
  const betterProduct = await stripe.products.create({
    name: 'Better - SEO Automation (Most Popular)',
    description: 'Semi-autonomous, 5 websites, 500 keywords',
    metadata: { tier: 'better', automationLevel: 'semi_autonomous' }
  });

  const betterMonthly = await stripe.prices.create({
    product: betterProduct.id,
    unit_amount: 44900, // $449 AUD
    currency: 'aud',
    recurring: { interval: 'month' },
    metadata: { tier: 'better', billingCycle: 'monthly' }
  });

  const betterAnnual = await stripe.prices.create({
    product: betterProduct.id,
    unit_amount: 449000, // $4490 AUD
    currency: 'aud',
    recurring: { interval: 'year' },
    metadata: { tier: 'better', billingCycle: 'annual' }
  });

  // Best Tier
  const bestProduct = await stripe.products.create({
    name: 'Best - SEO Automation',
    description: 'Full autopilot, unlimited websites/keywords',
    metadata: { tier: 'best', automationLevel: 'full_autopilot' }
  });

  const bestMonthly = await stripe.prices.create({
    product: bestProduct.id,
    unit_amount: 59900, // $599 AUD
    currency: 'aud',
    recurring: { interval: 'month' },
    metadata: { tier: 'best', billingCycle: 'monthly' }
  });

  const bestAnnual = await stripe.prices.create({
    product: bestProduct.id,
    unit_amount: 599000, // $5990 AUD
    currency: 'aud',
    recurring: { interval: 'year' },
    metadata: { tier: 'best', billingCycle: 'annual' }
  });

  console.log('Stripe products created:', {
    good: { monthly: goodMonthly.id, annual: goodAnnual.id },
    better: { monthly: betterMonthly.id, annual: betterAnnual.id },
    best: { monthly: bestMonthly.id, annual: bestAnnual.id }
  });
}
```

### 5.2 Checkout Session Creation

```typescript
// app/api/payments/create-checkout-session/route.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { clientId, tier, billingCycle } = await request.json();

  // Price IDs from Stripe setup (stored in .env)
  const priceMap = {
    good: {
      monthly: process.env.STRIPE_PRICE_GOOD_MONTHLY!,
      annual: process.env.STRIPE_PRICE_GOOD_ANNUAL!
    },
    better: {
      monthly: process.env.STRIPE_PRICE_BETTER_MONTHLY!,
      annual: process.env.STRIPE_PRICE_BETTER_ANNUAL!
    },
    best: {
      monthly: process.env.STRIPE_PRICE_BEST_MONTHLY!,
      annual: process.env.STRIPE_PRICE_BEST_ANNUAL!
    }
  };

  const priceId = priceMap[tier][billingCycle];

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?tier=${tier}`,
    metadata: { clientId, tier, billingCycle },
    customer_email: client.email, // Pre-fill email
    subscription_data: {
      metadata: { clientId, tier, automationLevel: getAutomationLevel(tier) }
    }
  });

  return Response.json({ sessionId: session.id, url: session.url });
}
```

### 5.3 Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Log webhook event
  await db.run(`
    INSERT INTO webhook_events (id, event_type, stripe_event_id, payload, processed)
    VALUES (?, ?, ?, ?, FALSE)
  `, [generateId(), event.type, event.id, JSON.stringify(event.data)]);

  // Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;
  }

  // Mark webhook as processed
  await db.run(`
    UPDATE webhook_events SET processed = TRUE, processed_at = datetime('now')
    WHERE stripe_event_id = ?
  `, [event.id]);

  return Response.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { clientId, tier, billingCycle } = session.metadata!;

  // 1. Create subscription record
  const subscriptionId = generateId();
  await db.run(`
    INSERT INTO subscriptions (
      id, client_id, tier, billing_cycle, status,
      current_period_start, current_period_end
    ) VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now', '+1 month'))
  `, [subscriptionId, clientId, tier, billingCycle]);

  // 2. Create Stripe customer mapping
  await db.run(`
    INSERT INTO stripe_customers (id, client_id, stripe_customer_id, stripe_subscription_id)
    VALUES (?, ?, ?, ?)
  `, [generateId(), clientId, session.customer, session.subscription]);

  // 3. Grant tier access
  const features = getTierFeatures(tier);
  const automationLevel = getAutomationLevel(tier);
  const approvalRequired = tier !== 'best';

  await db.run(`
    INSERT INTO tier_access (
      id, client_id, tier, features, automation_level, approval_required
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [generateId(), clientId, tier, JSON.stringify(features), automationLevel, approvalRequired]);

  // 4. Update client status
  await db.run(`
    UPDATE client_onboarding SET status = 'active', tier = ? WHERE id = ?
  `, [tier, clientId]);

  // 5. Initialize AI agents (AUTONOMOUS)
  await initializeAgents(clientId, tier);

  // 6. Send welcome email
  await sendWelcomeEmail(clientId, tier);
}
```

---

## 6. AI Agent System

### 6.1 Agent Registry

```typescript
// services/agents/agent-registry.ts
export interface Agent {
  id: string;
  name: string;
  description: string;
  triggerType: 'scheduled' | 'event' | 'manual';
  schedule?: string; // Cron expression
  approvalRequired: (tier: string) => boolean;
  execute: (clientId: string, context: any) => Promise<AgentResult>;
}

export const agentRegistry: Agent[] = [
  {
    id: 'seo-audit-agent',
    name: 'SEO Audit Agent',
    description: 'Performs comprehensive SEO audits using Lighthouse',
    triggerType: 'scheduled',
    schedule: (tier: string) => {
      if (tier === 'good') return '0 0 1 * *'; // Monthly (1st)
      if (tier === 'better') return '0 0 * * 1'; // Weekly (Monday)
      if (tier === 'best') return '0 0 * * *'; // Daily
      return '';
    },
    approvalRequired: (tier) => tier === 'good',
    execute: async (clientId, context) => {
      // Execute SEO audit
      return await executeSEOAudit(clientId);
    }
  },

  {
    id: 'keyword-tracker-agent',
    name: 'Keyword Tracker Agent',
    description: 'Tracks keyword rankings daily',
    triggerType: 'scheduled',
    schedule: () => '0 6 * * *', // Daily at 6am
    approvalRequired: () => false, // No approval for any tier
    execute: async (clientId) => {
      return await executeKeywordTracking(clientId);
    }
  },

  {
    id: 'content-generator-agent',
    name: 'Content Generator Agent',
    description: 'Generates SEO-optimized content',
    triggerType: 'event', // Triggered by user or schedule
    approvalRequired: (tier) => tier !== 'best', // Good/Better need approval
    execute: async (clientId, context) => {
      return await generateContent(clientId, context);
    }
  },

  // ... more agents
];
```

### 6.2 Agent Scheduler

```typescript
// services/agents/agent-scheduler.ts
import cron from 'node-cron';
import { agentRegistry } from './agent-registry';
import db from '@/database/init';

export function initializeAgentScheduler() {
  console.log('[Agent Scheduler] Initializing...');

  // For each agent with scheduled trigger
  agentRegistry.forEach(agent => {
    if (agent.triggerType === 'scheduled') {
      // Get all active clients
      const clients = db.prepare(`
        SELECT c.id, c.tier
        FROM client_onboarding c
        INNER JOIN tier_access t ON c.id = t.client_id
        WHERE c.status = 'active'
      `).all() as { id: string; tier: string }[];

      clients.forEach(client => {
        const schedule = agent.schedule!(client.tier);
        if (!schedule) return;

        cron.schedule(schedule, async () => {
          console.log(`[Agent Scheduler] Executing ${agent.name} for client ${client.id}`);

          // Check if approval required
          const needsApproval = agent.approvalRequired(client.tier);

          if (needsApproval) {
            // Create approval task
            await createApprovalTask(client.id, agent, {});
          } else {
            // Execute immediately
            await executeAgent(client.id, agent, {});
          }
        });
      });
    }
  });

  console.log('[Agent Scheduler] Initialized successfully');
}

async function createApprovalTask(clientId: string, agent: Agent, context: any) {
  const taskId = generateId();

  // Execute agent to get recommendations
  const result = await agent.execute(clientId, context);

  // Store as pending approval
  db.prepare(`
    INSERT INTO approval_tasks (
      id, client_id, task_type, task_data, status, approval_required_by
    ) VALUES (?, ?, ?, ?, 'pending', datetime('now', '+7 days'))
  `).run(taskId, clientId, agent.id, JSON.stringify(result));

  // Send notification
  await sendApprovalNotification(clientId, agent.name, taskId);
}

async function executeAgent(clientId: string, agent: Agent, context: any) {
  const logId = generateId();

  // Log start
  db.prepare(`
    INSERT INTO agent_execution_logs (
      id, client_id, agent_name, task_type, execution_mode, status, started_at
    ) VALUES (?, ?, ?, ?, 'autonomous', 'running', datetime('now'))
  `).run(logId, clientId, agent.name, agent.id);

  try {
    const startTime = Date.now();
    const result = await agent.execute(clientId, context);
    const executionTime = Date.now() - startTime;

    // Log success
    db.prepare(`
      UPDATE agent_execution_logs
      SET status = 'completed', execution_time_ms = ?, results = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(executionTime, JSON.stringify(result), logId);

    // Send success notification
    await sendExecutionCompleteNotification(clientId, agent.name, result);

  } catch (error: any) {
    // Log error
    db.prepare(`
      UPDATE agent_execution_logs
      SET status = 'failed', error_message = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(error.message, logId);

    // Send error notification
    await sendExecutionErrorNotification(clientId, agent.name, error.message);
  }
}
```

---

## 7. Tier Enforcement Middleware

```typescript
// middleware/tier-enforcement.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/database/init';

export async function tierEnforcementMiddleware(request: NextRequest) {
  const clientId = request.headers.get('x-client-id');
  if (!clientId) return NextResponse.next();

  // Get tier access
  const tierAccess = db.prepare(`
    SELECT tier, features, automation_level, expires_at
    FROM tier_access
    WHERE client_id = ?
  `).get(clientId) as any;

  if (!tierAccess) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
  }

  // Check if subscription expired
  if (tierAccess.expires_at && new Date(tierAccess.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Subscription expired' }, { status: 403 });
  }

  // Feature gate enforcement
  const features = JSON.parse(tierAccess.features);
  const requestedFeature = extractFeature(request.url);

  if (requestedFeature && !isFeatureAllowed(requestedFeature, features)) {
    return NextResponse.json({
      error: 'Feature not available in your tier',
      upgradeRequired: getRequiredTier(requestedFeature),
      currentTier: tierAccess.tier
    }, { status: 402 }); // 402 Payment Required
  }

  return NextResponse.next();
}

function isFeatureAllowed(feature: string, tierFeatures: any): boolean {
  const featureMap: Record<string, (features: any) => boolean> = {
    'unlimited_websites': (f) => f.websites === -1,
    'daily_audits': (f) => f.audit_frequency === 'daily',
    'ai_autopilot': (f) => f.automation_level === 'full_autopilot',
    'unlimited_keywords': (f) => f.keywords === -1,
  };

  return featureMap[feature]?.(tierFeatures) ?? true;
}
```

---

## 8. Deployment Checklist

### 8.1 Environment Variables

```bash
# .env.local (Production)

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_GOOD_MONTHLY=price_...
STRIPE_PRICE_GOOD_ANNUAL=price_...
STRIPE_PRICE_BETTER_MONTHLY=price_...
STRIPE_PRICE_BETTER_ANNUAL=price_...
STRIPE_PRICE_BEST_MONTHLY=price_...
STRIPE_PRICE_BEST_ANNUAL=price_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database (existing)
DATABASE_URL=postgresql://...

# Encryption (existing)
ENCRYPTION_KEY=...

# AI Services (existing)
QWEN_API_KEY=...
ANTHROPIC_API_KEY=...
```

### 8.2 Stripe Setup Steps

1. **Create Stripe Account** (or use test mode)
   ```bash
   stripe login
   ```

2. **Run Stripe Setup Script**
   ```bash
   npm run stripe:setup
   ```

3. **Configure Webhook Endpoint**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook secret to `.env.local`

4. **Test Payment Flow**
   ```bash
   npm run test:payment
   ```

### 8.3 Database Migration

```bash
# Create subscriptions schema
npm run db:migrate:create subscriptions

# Apply migration
npm run db:migrate
```

### 8.4 Agent Scheduler Initialization

```bash
# Start agent scheduler (runs in background)
npm run agents:start

# Verify agents running
npm run agents:status
```

---

## 9. Testing Strategy

### 9.1 Payment Flow Testing

```typescript
// tests/payment-flow.test.ts
describe('Payment Flow', () => {
  test('Good Tier - Monthly Subscription', async () => {
    const response = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'test-client',
        tier: 'good',
        billingCycle: 'monthly'
      })
    });

    expect(response.ok).toBe(true);
    const { sessionId } = await response.json();
    expect(sessionId).toBeDefined();
  });

  test('Webhook - Checkout Complete', async () => {
    // Simulate Stripe webhook
    const event = createStripeEvent('checkout.session.completed', {
      metadata: { clientId: 'test-client', tier: 'good' }
    });

    const response = await fetch('/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': generateSignature(event) },
      body: JSON.stringify(event)
    });

    expect(response.ok).toBe(true);

    // Verify subscription created
    const subscription = await getSubscription('test-client');
    expect(subscription.tier).toBe('good');
    expect(subscription.status).toBe('active');
  });
});
```

### 9.2 Tier Enforcement Testing

```typescript
// tests/tier-enforcement.test.ts
describe('Tier Enforcement', () => {
  test('Good Tier - Cannot access unlimited keywords', async () => {
    const response = await fetch('/api/keywords', {
      headers: { 'x-client-id': 'good-tier-client' }
    });

    // Should allow up to 50 keywords
    const { keywords } = await response.json();
    expect(keywords.length).toBeLessThanOrEqual(50);
  });

  test('Best Tier - Full access', async () => {
    const response = await fetch('/api/keywords', {
      headers: { 'x-client-id': 'best-tier-client' }
    });

    // Should allow unlimited keywords
    const { keywords } = await response.json();
    expect(keywords.length).toBeGreaterThan(50);
  });
});
```

---

## 10. Success Metrics

### Key Performance Indicators (KPIs)

1. **Subscription Conversion Rate**: % of visitors who complete payment
2. **Tier Distribution**: % of users in Good/Better/Best
3. **Approval Task Completion Rate**: % of pending tasks approved (Good/Better)
4. **Agent Success Rate**: % of successful autonomous executions
5. **Customer Satisfaction**: NPS score, support ticket volume
6. **MRR (Monthly Recurring Revenue)**: Total subscription revenue
7. **Churn Rate**: % of cancellations per month

### Monitoring Dashboard

- Real-time subscription status
- Active agent executions
- Pending approval tasks
- Payment failures & retries
- Agent error rates

---

## Summary

This architecture provides **100% autonomous AI-driven automation** with tier-based approval workflows:

- **Good Tier**: AI recommends, human approves (manual)
- **Better Tier**: AI executes automatically, human approves publishing (semi-autonomous)
- **Best Tier**: AI executes everything including publishing (full autopilot)
- **Custom Tier**: Fully customizable workflows

**Next Steps:**
1. Create database schema
2. Build Stripe integration
3. Implement agent scheduler
4. Build approval workflow UI
5. Test payment flow end-to-end
6. Deploy to production

**Estimated Time:** 20-24 hours of focused development
