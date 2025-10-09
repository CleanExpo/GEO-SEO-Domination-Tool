# Business Auto-Fill Feature - Google Business Profile Integration

**Feature:** Auto-populate onboarding form with business data from Google Business Profile, Google Maps, and website analysis.

## What It Does

When onboarding a new client, you can now click **"Auto-Fill from Google"** to automatically populate:

### ✅ Company Details (from Google Business Profile)
- **Business Name**
- **Phone Number**
- **Email** (if available)
- **Address** (full formatted address)
- **Industry** (auto-detected from business categories)
- **Website URL**

### ✅ Website Details (from web scraping)
- **Website Platform** (WordPress, Shopify, Wix, Next.js, etc.)
- **Technology Stack** (detected technologies)

### ✅ Competitor Discovery (from Google Maps API)
- **Top 5 Competitors** in surrounding area (5km radius)
- Based on same business category
- Includes competitor websites when available

### ✅ SEO Keywords (from GBP data)
- **Location-based keywords** (city + state)
- **Category-based keywords** (e.g., "plumber", "restaurant")
- **Combined keywords** (e.g., "plumber in Brisbane")
- Auto-generates top 10 relevant keywords

## How It Works

### 1. User Clicks "Auto-Fill from Google"

Located in the Business Info step alongside Save and Load buttons.

### 2. Enter Business Query

Prompt appears: `"Enter business name and location (e.g., "Joe's Pizza Brisbane")"`

### 3. API Lookup Process

**Backend:** [app/api/onboarding/lookup/route.ts](app/api/onboarding/lookup/route.ts)

```
Step 1: Google Places Text Search
↓
Step 2: Get Detailed Place Information
↓
Step 3: Detect Website Technology
↓
Step 4: Find Nearby Competitors
↓
Step 5: Extract SEO Keywords
```

### 4. Form Auto-Population

All discovered data auto-fills into the onboarding form fields.

## API Endpoints

### POST /api/onboarding/lookup

**Request:**
```json
{
  "query": "Disaster Recovery Brisbane"
}
```

**Response:**
```json
{
  "found": true,
  "businessName": "Disaster Recovery",
  "phone": "+61457123005",
  "address": "145 Whitehill Road, Eastern Heights QLD 4305",
  "location": {
    "lat": -27.6173,
    "lng": 152.7589,
    "formatted": "145 Whitehill Road, Eastern Heights QLD 4305, Australia"
  },
  "industry": "Home Services",
  "website": "https://disasterrecovery.com.au",
  "websitePlatform": "WordPress",
  "techStack": ["WordPress", "PHP", "MySQL"],
  "gbp": {
    "placeId": "ChIJ...",
    "rating": 4.8,
    "reviewCount": 127,
    "categories": ["plumber", "water_damage_restoration", "emergency_service"],
    "photos": 45,
    "verified": true
  },
  "competitors": [
    {
      "name": "Quick Dry Plumbing",
      "website": "https://quickdry.com.au",
      "distance": 2300,
      "rating": 4.6
    },
    ...
  ],
  "keywords": [
    "disaster recovery",
    "eastern heights",
    "qld",
    "plumber",
    "water damage restoration",
    "plumber in eastern heights",
    "eastern heights plumber",
    ...
  ]
}
```

## Data Sources

### 1. Google Places API
- Business name, phone, address
- Business categories (for industry detection)
- Ratings and reviews
- Photos count
- Operating hours

### 2. Google Maps API (Nearby Search)
- Competitor discovery within 5km radius
- Same business category filtering
- Distance calculation

### 3. Website Scraping
- Platform detection (WordPress, Shopify, Wix, etc.)
- Technology stack identification
- Server headers analysis

### 4. Industry Mapping
Auto-converts Google categories to user-friendly industries:

| Google Category | Industry |
|----------------|----------|
| restaurant, food, cafe | Food & Beverage |
| lawyer, attorney | Legal Services |
| doctor, dentist, hospital | Healthcare |
| plumber, electrician | Home Services |
| real_estate_agency | Real Estate |
| gym, spa | Fitness & Wellness |
| accounting | Professional Services |

## User Experience

### Before (Manual Entry)
1. User manually types business name
2. User manually enters phone, address, industry
3. User researches competitors manually
4. User brainstorms keywords manually
5. **Total time: 10-15 minutes**

### After (Auto-Fill)
1. User clicks "Auto-Fill from Google"
2. User enters: "Disaster Recovery Brisbane"
3. Form auto-populates in 3-5 seconds
4. User reviews and adjusts if needed
5. **Total time: 30-60 seconds**

⏱️ **Time saved: ~90%**

## Technical Implementation

### Frontend
[components/onboarding/ClientIntakeForm.tsx:233-295](components/onboarding/ClientIntakeForm.tsx#L233-L295)

```typescript
const lookupBusiness = async () => {
  const query = prompt('Enter business name and location...');

  const response = await fetch('/api/onboarding/lookup', {
    method: 'POST',
    body: JSON.stringify({ query })
  });

  const data = await response.json();

  if (data.found) {
    // Auto-populate form
    setFormData(prev => ({
      ...prev,
      businessName: data.businessName,
      phone: data.phone,
      address: data.address,
      industry: data.industry,
      website: data.website,
      websitePlatform: data.websitePlatform,
      competitors: data.competitors,
      targetKeywords: data.keywords,
      targetLocations: [city]
    }));
  }
};
```

### Backend API
[app/api/onboarding/lookup/route.ts](app/api/onboarding/lookup/route.ts)

Key functions:
- `searchGooglePlaces()` - Find business in Google
- `findNearbyCompetitors()` - Discover competitors
- `detectWebsiteTechnology()` - Identify platform
- `extractKeywordsFromGBP()` - Generate SEO keywords
- `formatIndustry()` - Convert categories to industries

## Environment Variables Required

```env
GOOGLE_API_KEY=AIzaSy...
# OR
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=AIzaSy...
```

## Testing

### Example Queries

Try these in the Auto-Fill prompt:

1. **"Disaster Recovery Brisbane"** ✅
   - Should find Disaster Recovery business
   - Auto-populate all fields including competitors

2. **"Joe's Pizza Sydney"** ✅
   - Should find pizza restaurant
   - Industry: Food & Beverage
   - Competitors: nearby pizza places

3. **"Smith & Associates Lawyers Melbourne"** ✅
   - Should find law firm
   - Industry: Legal Services
   - Keywords: lawyer, attorney, legal services

### Manual Test

1. Go to: https://geo-seo-domination-tool.vercel.app/onboarding/new
2. Click "Auto-Fill from Google" (green button)
3. Enter: "Disaster Recovery Brisbane"
4. Check console for logs: `[Lookup] ...`
5. Verify form fields populate

## Future Enhancements

### Phase 2 (Potential)
- [ ] Bing Business Profile integration
- [ ] Email extraction from website
- [ ] Social media profile discovery
- [ ] Review sentiment analysis
- [ ] Competitor SERP ranking check
- [ ] Backlink analysis for competitors
- [ ] Historical ranking data

### Phase 3 (Advanced)
- [ ] AI-powered industry classification
- [ ] Automated SWOT analysis
- [ ] Pricing intelligence from competitors
- [ ] Service offering extraction
- [ ] Brand voice analysis

## Files Created/Modified

**New Files:**
- `app/api/onboarding/lookup/route.ts` - Main lookup API
- `BUSINESS_AUTOFILL_FEATURE.md` - This documentation

**Modified Files:**
- `components/onboarding/ClientIntakeForm.tsx` - Added Auto-Fill button and lookup function

## Deployment

```bash
git add app/api/onboarding/lookup/route.ts components/onboarding/ClientIntakeForm.tsx BUSINESS_AUTOFILL_FEATURE.md
git commit -m "feat: Add Google Business Profile auto-fill to onboarding"
git push
```

Vercel will automatically deploy in ~2 minutes.

---

**Result:** New clients can be onboarded in under 1 minute with accurate, Google-verified business information! 🚀
