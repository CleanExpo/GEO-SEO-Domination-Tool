# GEO-SEO Domination Tool - Completion Roadmap

**Current Status:** 3/23 pages functional (13%)
**Target:** 23/23 pages functional (100%)
**Estimated Effort:** 15-20 hours

---

## ✅ Currently Working (3 pages)

1. **Dashboard** (`/dashboard`) - Fetches data, displays stats
2. **Companies** (`/companies`) - Create/list companies with dialog
3. **SEO Audits** (`/audits`) - Full audit system with Lighthouse + Firecrawl

---

## 🔨 High Priority Fixes (Core SEO Features)

### 1. Keywords Page (`/keywords`) - 2-3 hours
**Issues:**
- ❌ "Add Keywords" button (line 51) - no onClick
- ❌ "Add Your First Keyword" button (line 129) - no onClick
- ❌ No dialog/modal for keyword input
- ❌ No API integration (static empty array)

**Tasks:**
- [ ] Create `KeywordDialog.tsx` component
  - Company selector dropdown
  - Keyword input field
  - Location input
  - Search volume/difficulty fields
- [ ] Add onClick handlers to both buttons
- [ ] Integrate with `POST /api/keywords`
- [ ] Fetch keywords on mount with `GET /api/keywords`
- [ ] Display keywords in table with real data

**Acceptance Criteria:**
- User can click "Add Keywords" → Dialog opens
- User can select company and enter keyword → Saves to database
- Keywords list refreshes and displays new entry

---

### 2. Rankings Page (`/rankings`) - 2-3 hours
**Issues:**
- ❌ "Track Your First Keyword" button (line 142) - no onClick
- ❌ No dialog for tracking setup
- ❌ No API integration

**Tasks:**
- [ ] Create `RankingDialog.tsx` component
  - Keyword selector (from keywords API)
  - Location input
  - Search engine selector (Google/Bing)
- [ ] Add onClick handler
- [ ] Integrate with `POST /api/rankings`
- [ ] Fetch rankings with `GET /api/rankings`
- [ ] Display ranking trends with real data

**Acceptance Criteria:**
- User can track keyword rankings
- Historical position data displays in charts
- Trend indicators show up/down changes

---

### 3. Settings Page (`/settings`) - 3-4 hours
**Issues:**
- ❌ 5 navigation buttons (lines 67-78) - no onClick
  - Account Settings
  - API Keys
  - Notifications
  - Billing
  - Team
- ❌ "Save Changes" button (line 104) - no onClick
- ❌ No state management for active tab
- ❌ No persistence logic

**Tasks:**
- [ ] Create tab state management (useState)
- [ ] Add onClick handlers to all nav buttons
- [ ] Build Account Settings tab
  - User profile form
  - Email/password update
- [ ] Build API Keys tab
  - Display existing keys
  - Generate new keys
  - Revoke keys
- [ ] Build Notifications tab
  - Email preferences
  - Slack/webhook integrations
- [ ] Create `PATCH /api/settings` endpoint
- [ ] Implement save functionality

**Acceptance Criteria:**
- Tabs switch content when clicked
- Settings persist to database
- API keys can be generated/revoked
- Notifications preferences save correctly

---

### 4. Reports Page (`/reports`) - 4-5 hours
**Issues:**
- ⚠️ Shows alert "not yet implemented"
- ❌ No actual report generation
- ❌ No export functionality

**Tasks:**
- [ ] Build report generation logic
  - SEO Audit Report (PDF)
  - Keyword Research Report (CSV)
  - Competitor Analysis Report (PDF)
  - Ranking Tracking Report (CSV/PDF)
- [ ] Create `POST /api/reports/generate` endpoint
- [ ] Integrate PDF library (jsPDF or Puppeteer)
- [ ] Integrate CSV export (papaparse)
- [ ] Add download functionality
- [ ] Create report templates

**Acceptance Criteria:**
- User selects company + report type → Generates report
- PDF/CSV downloads automatically
- Reports contain actual data from database
- Email option to send report

---

## 🔧 Medium Priority Fixes (Support Features)

### 5. Projects - Notes Page (`/projects/notes`) - 1-2 hours
**Issues:**
- ❌ Edit button (line 95) - no onClick
- ❌ Delete button (line 98) - no onClick

**Tasks:**
- [ ] Create `EditNoteModal.tsx`
- [ ] Create `DeleteNoteModal.tsx` (confirmation)
- [ ] Add onClick handlers
- [ ] Integrate with `PATCH /api/notes/:id`
- [ ] Integrate with `DELETE /api/notes/:id`

---

### 6. Support Page (`/support`) - 1 hour
**Issues:**
- ❌ Contact form submit button (line 124) - no onClick

**Tasks:**
- [ ] Add form validation (Zod)
- [ ] Create `POST /api/support/contact` endpoint
- [ ] Integrate email service (Resend/SendGrid)
- [ ] Add success/error notifications

---

## 📚 Low Priority Fixes (Resources)

### 7. Resources - Tutorials Page (`/resources/tutorials`) - 1 hour
**Issues:**
- ❌ "Start Learning" button (line 85) - no onClick

**Tasks:**
- [ ] Add tutorial navigation logic
- [ ] Link to tutorial content pages
- [ ] Track progress (localStorage or DB)

---

## 🔍 Pages to Verify (Unknown Status)

These pages were not checked yet. Need to verify if functional or broken:

1. **CRM Pages** (4 pages)
   - [ ] `/crm/contacts`
   - [ ] `/crm/deals`
   - [ ] `/crm/tasks`
   - [ ] `/crm/calendar`

2. **Project Pages** (3 pages)
   - [ ] `/projects` (main)
   - [ ] `/projects/github`
   - [ ] `/projects/notes` (already noted as broken)

3. **Resource Pages** (4 pages)
   - [ ] `/resources/prompts`
   - [ ] `/resources/components`
   - [ ] `/resources/ai-tools`
   - [ ] `/resources/tutorials` (already noted as broken)

---

## 📋 Implementation Checklist

### For Each Broken Page:

#### Step 1: Create Dialog Component
```typescript
// Example: KeywordDialog.tsx
- [ ] Create component file
- [ ] Add form fields with validation
- [ ] Add loading/error states
- [ ] Add close functionality
```

#### Step 2: Update Page Component
```typescript
- [ ] Import dialog component
- [ ] Add useState for dialog open/close
- [ ] Add onClick handlers to buttons
- [ ] Add data fetching on mount (useEffect)
- [ ] Update static data with API data
```

#### Step 3: Verify/Create API Route
```typescript
- [ ] Check if POST /api/[resource] exists
- [ ] Add validation with Zod
- [ ] Add Supabase integration
- [ ] Add error handling
- [ ] Test with Postman/curl
```

#### Step 4: Test End-to-End
```typescript
- [ ] Click button → Dialog opens
- [ ] Fill form → Submit succeeds
- [ ] List refreshes with new data
- [ ] Error handling works
- [ ] Loading states display
```

---

## 🚀 Deployment Strategy

### Phase 1: Core Features (Week 1)
- Keywords page
- Rankings page
- Settings page (Account + API Keys)

### Phase 2: Reporting & Support (Week 2)
- Reports generation
- Support contact form
- Projects/Notes editing

### Phase 3: Verification & Polish (Week 3)
- Verify all CRM pages
- Verify all Resource pages
- End-to-end testing
- Bug fixes

---

## 📊 Progress Tracking

**Total Pages:** 23
**Working:** 3 (13%)
**In Progress:** 0
**Remaining:** 20 (87%)

**Completion Target:** 100% functional

---

## 🛠️ Technical Debt to Address

1. **Reusable Components**
   - Create base Dialog component
   - Create base Form component
   - Create base Table component

2. **API Architecture**
   - Standardize error responses
   - Add request/response logging
   - Add rate limiting

3. **Testing**
   - Add unit tests for API routes
   - Add integration tests for dialogs
   - Add E2E tests with Playwright

4. **Documentation**
   - API documentation
   - Component documentation
   - User guides

---

## 📝 Notes

- All broken pages have the same pattern: UI shell without business logic
- RLS policies must be verified for each new table
- Email notifications need SendGrid/Resend configuration
- Report generation needs PDF/CSV libraries
- Consider creating a page completion checklist template

---

**Last Updated:** 2025-10-03
**Next Review:** After completing Phase 1
