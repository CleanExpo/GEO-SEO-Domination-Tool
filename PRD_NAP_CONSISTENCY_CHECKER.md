# PRD: NAP Consistency Checker & E-E-A-T Validator

## Product Overview

**Product Name**: NAP Consistency Checker & GMB Category Validator
**Version**: 1.0
**Target**: GEO-SEO Domination Tool - New Client Onboarding
**Priority**: High (Critical for Local SEO & E-E-A-T)

## Problem Statement

### Current Issues
1. **Two Auto-Fill Methods Without Comparison**:
   - "Auto-Fill from Google" (Google Places API)
   - "Auto-Fill from Website" (Website scraper)
   - **No validation** if these match

2. **E-E-A-T Risk**:
   - Inconsistent NAP (Name, Address, Phone) across platforms damages trust signals
   - Google's E-E-A-T algorithm penalizes inconsistency
   - Local ranking suffers when website ≠ GMB listing

3. **Missing GMB Category Validation**:
   - No check if business categories match across platforms
   - Categories affect local pack ranking
   - Wrong categories = poor visibility

## Success Metrics

- **100% NAP Match Rate**: All fields identical across Google vs Website
- **Category Alignment**: GMB categories match website Schema.org
- **E-E-A-T Score**: Automated consistency scoring (0-100)
- **User Adoption**: 80%+ of onboarding sessions use consistency checker

## User Stories

### US-1: Side-by-Side Comparison
**As a** SEO manager
**I want to** see Google vs Website data side-by-side
**So that** I can identify and fix inconsistencies before they hurt rankings

**Acceptance Criteria**:
- ✅ UI shows two columns: "Google My Business" vs "Website"
- ✅ Highlights differences in red
- ✅ Highlights matches in green
- ✅ Shows exact character-by-character diff for mismatches

### US-2: NAP Consistency Score
**As a** business owner
**I want to** see a consistency score (0-100)
**So that** I know how badly my listings hurt my SEO

**Acceptance Criteria**:
- ✅ Calculates weighted score: Name (30%), Address (40%), Phone (30%)
- ✅ Shows score with color coding (Red <70, Yellow 70-90, Green >90)
- ✅ Provides actionable recommendations for each mismatch

### US-3: GMB Category Validation
**As a** local business
**I want to** validate my GMB categories match my website
**So that** Google understands my business correctly

**Acceptance Criteria**:
- ✅ Fetches GMB primary + secondary categories
- ✅ Extracts Schema.org categories from website
- ✅ Shows category match percentage
- ✅ Suggests optimal categories based on industry

### US-4: Auto-Fix Recommendations
**As a** user
**I want to** automatically fix inconsistencies
**So that** I don't have to manually update all platforms

**Acceptance Criteria**:
- ✅ "Use Google Data" button - copies GMB data to form
- ✅ "Use Website Data" button - copies website data to form
- ✅ "Smart Merge" button - picks most complete/accurate version
- ✅ Shows changelog of what will change

## Technical Architecture

### API Endpoints

#### 1. `/api/onboarding/consistency-check`
**POST** - Compare Google vs Website data

**Request**:
```json
{
  "businessName": "string (optional)",
  "website": "string (required)",
  "includeGoogle": true,
  "includeWebsite": true
}
```

**Response**:
```json
{
  "consistency": {
    "score": 85,
    "nameMatch": true,
    "addressMatch": false,
    "phoneMatch": true,
    "emailMatch": true,
    "categoryMatch": "partial"
  },
  "google": {
    "name": "CARSI Disaster Recovery",
    "address": "123 Main St, Brisbane QLD 4000",
    "phone": "+61 7 1234 5678",
    "categories": ["Disaster Recovery", "Water Damage Restoration"],
    "rating": 4.8,
    "reviews": 127
  },
  "website": {
    "name": "Carsi Disaster Recovery",
    "address": "123 Main Street, Brisbane, QLD 4000",
    "phone": "07 1234 5678",
    "email": "info@carsi.com.au",
    "categories": ["Emergency Services", "Restoration"],
    "schema": "LocalBusiness"
  },
  "differences": [
    {
      "field": "address",
      "google": "123 Main St, Brisbane QLD 4000",
      "website": "123 Main Street, Brisbane, QLD 4000",
      "severity": "medium",
      "recommendation": "Standardize street abbreviation"
    }
  ],
  "recommendations": [
    "Update GMB address to match website format",
    "Add phone number to website in same format as GMB",
    "Add 'Water Damage Restoration' to website Schema.org"
  ]
}
```

#### 2. `/api/onboarding/gmb-categories`
**GET** - Fetch valid GMB categories for industry

**Request**: `?industry=disaster-recovery`

**Response**:
```json
{
  "primary": [
    "Water Damage Restoration Service",
    "Fire Damage Restoration Service",
    "Emergency Restoration Service"
  ],
  "secondary": [
    "Mold Remediation Service",
    "Damage Restoration Service",
    "Emergency Plumber"
  ],
  "recommended": {
    "primary": "Water Damage Restoration Service",
    "reasoning": "Most specific for core service"
  }
}
```

### UI Components

#### 1. `ConsistencyCheckPanel.tsx`
Side-by-side comparison panel

```tsx
<ConsistencyCheckPanel
  googleData={googleResult}
  websiteData={websiteResult}
  onSelectSource={(source) => applyDataToForm(source)}
/>
```

**Features**:
- Two-column layout
- Diff highlighting
- Consistency score badge
- One-click data application

#### 2. `NAPScoreCard.tsx`
Visual scorecard for NAP consistency

```tsx
<NAPScoreCard
  score={85}
  breakdown={{
    name: 100,
    address: 75,
    phone: 90
  }}
  issues={['Address format mismatch']}
/>
```

#### 3. `CategoryMatcher.tsx`
GMB category alignment tool

```tsx
<CategoryMatcher
  gmbCategories={['Disaster Recovery']}
  websiteCategories={['Emergency Services']}
  suggestions={recommendedCategories}
  onUpdate={(categories) => updateGMB(categories)}
/>
```

### Data Flow

```
1. User enters business name OR website
   ↓
2. Trigger both lookups in parallel:
   - Google Places API (if business name)
   - Website Scraper (if URL)
   ↓
3. Send both results to /api/onboarding/consistency-check
   ↓
4. API analyzes differences:
   - String similarity (Levenshtein distance)
   - Phone normalization (remove spaces, brackets)
   - Address standardization (St vs Street)
   - Category mapping (Schema.org → GMB)
   ↓
5. Return consistency score + recommendations
   ↓
6. UI displays:
   - Side-by-side comparison
   - Highlighted differences
   - Quick-fix buttons
   ↓
7. User selects fix option:
   - "Use Google Data"
   - "Use Website Data"
   - "Smart Merge" (best of both)
   ↓
8. Form auto-fills with selected data
```

## Scoring Algorithm

### NAP Consistency Score (0-100)

```javascript
const calculateConsistencyScore = (google, website) => {
  const nameScore = stringSimilarity(google.name, website.name) * 30;
  const addressScore = addressSimilarity(google.address, website.address) * 40;
  const phoneScore = phoneSimilarity(google.phone, website.phone) * 30;

  return Math.round(nameScore + addressScore + phoneScore);
};

// String similarity using Levenshtein distance
const stringSimilarity = (a, b) => {
  const distance = levenshteinDistance(normalize(a), normalize(b));
  const maxLen = Math.max(a.length, b.length);
  return 1 - (distance / maxLen);
};

// Address similarity (handles abbreviations)
const addressSimilarity = (a, b) => {
  const normalized_a = standardizeAddress(a);
  const normalized_b = standardizeAddress(b);
  return stringSimilarity(normalized_a, normalized_b);
};

// Phone similarity (removes formatting)
const phoneSimilarity = (a, b) => {
  const digits_a = extractDigits(a);
  const digits_b = extractDigits(b);
  return digits_a === digits_b ? 1 : 0;
};
```

### E-E-A-T Impact Score

```javascript
const calculateEEATImpact = (consistencyScore) => {
  if (consistencyScore >= 95) return 'Excellent - Strong trust signals';
  if (consistencyScore >= 85) return 'Good - Minor inconsistencies';
  if (consistencyScore >= 70) return 'Fair - Needs improvement';
  return 'Poor - Hurting rankings';
};
```

## Implementation Plan

### Phase 1: Backend API (Week 1)
- ✅ Create `/api/onboarding/consistency-check` endpoint
- ✅ Implement NAP comparison logic
- ✅ Add string similarity algorithms
- ✅ Build recommendation engine

### Phase 2: UI Components (Week 1-2)
- ✅ Build `ConsistencyCheckPanel` component
- ✅ Create `NAPScoreCard` visualization
- ✅ Add `CategoryMatcher` tool
- ✅ Integrate with existing onboarding flow

### Phase 3: GMB Integration (Week 2)
- ✅ Fetch GMB categories via Google My Business API
- ✅ Build category suggestion system
- ✅ Add category alignment scoring

### Phase 4: Testing & Refinement (Week 3)
- ✅ Test with 50+ real businesses
- ✅ Tune similarity thresholds
- ✅ Validate recommendations accuracy
- ✅ A/B test UI layouts

## Security & Privacy

- **API Keys**: Store Google API keys in environment variables
- **Rate Limiting**: Max 10 lookups per user per minute
- **Data Privacy**: Don't store scraped data, only validated results
- **GDPR Compliance**: Allow data deletion on request

## Success Criteria

### Must Have (MVP)
- ✅ Side-by-side comparison UI
- ✅ NAP consistency score (0-100)
- ✅ Red/yellow/green highlighting
- ✅ One-click "Use Google Data" button

### Should Have
- ✅ Category validation
- ✅ E-E-A-T impact score
- ✅ Detailed recommendations
- ✅ Smart merge option

### Nice to Have
- ⚪ Historical tracking (changes over time)
- ⚪ Automated alerts when inconsistency detected
- ⚪ Bulk validation for multiple locations
- ⚪ Integration with GMB API for auto-updates

## Dependencies

- **Google Places API**: For GMB data fetching
- **Google My Business API**: For category validation
- **Levenshtein Distance Library**: For string comparison
- **Address Standardization Library**: For address normalization

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Google API rate limits | High | Medium | Cache results, implement fallback |
| Website blocks scraper | Medium | High | Use Firecrawl as backup |
| False positives | Medium | Medium | Tune similarity thresholds |
| User ignores warnings | High | Low | Make score prominent, block submission if < 70 |

## Metrics Dashboard

Track these metrics post-launch:
- **Average Consistency Score**: Target > 85
- **Issues Detected**: Track by category (name, address, phone)
- **Fixes Applied**: % of users who click "Use Google Data"
- **Time Saved**: Avg time reduction in onboarding

---

**Status**: Ready for Development
**Estimated Effort**: 2-3 weeks
**Priority**: P0 (Critical for E-E-A-T)
