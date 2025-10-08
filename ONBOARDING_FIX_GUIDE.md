# 🔧 Onboarding "Failed to start onboarding" Fix Guide

## Problem

The onboarding form gets stuck on Step 5 (Services) with error: **"Failed to start onboarding"**

This occurs after successfully completing all 5 steps and clicking "Start Onboarding".

## Root Cause Analysis

Based on code review:

1. **API Endpoint**: `/api/onboarding/start/route.ts` expects these fields:
   - `businessName`
   - `email`
   - `contactName`
   - `primaryGoals` (array)
   - `targetKeywords` (array)
   - `contentTypes` (array)
   - `selectedServices` (array)

2. **Form Data**: The `ClientIntakeForm` component sends ALL form fields including optional ones

3. **Likely Issues**:
   - Database connection failure (onboarding orchestrator)
   - Missing/invalid portfolio data structure
   - Schema mismatch between form data and database expectations

## Solution 1: Add Data Persistence (Save Button)

### Features to Add:
1. **Save Progress** - Store incomplete onboarding data
2. **Load Saved Data** - Retrieve and resume from last step
3. **Auto-save** - Automatically save on each step completion

### Implementation Plan:

#### 1. Create Save/Load API Endpoints

**File**: `app/api/onboarding/save/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, email, formData, currentStep } = body;

    const db = await getDatabase();

    // Upsert saved onboarding data
    await db.run(
      `INSERT INTO saved_onboarding (business_name, email, form_data, current_step, last_saved)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(business_name, email)
       DO UPDATE SET form_data = ?, current_step = ?, last_saved = CURRENT_TIMESTAMP`,
      [businessName, email, JSON.stringify(formData), currentStep, JSON.stringify(formData), currentStep]
    );

    return NextResponse.json({ success: true, message: 'Progress saved' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to save progress', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessName = searchParams.get('businessName');
    const email = searchParams.get('email');

    if (!businessName || !email) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = await getDatabase();
    const saved = await db.get(
      `SELECT form_data, current_step, last_saved
       FROM saved_onboarding
       WHERE business_name = ? AND email = ?`,
      [businessName, email]
    );

    if (!saved) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      formData: JSON.parse(saved.form_data),
      currentStep: saved.current_step,
      lastSaved: saved.last_saved
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load progress', details: error.message },
      { status: 500 }
    );
  }
}
```

#### 2. Add Database Schema

**File**: `database/saved-onboarding-schema.sql`

```sql
-- Saved onboarding progress table
CREATE TABLE IF NOT EXISTS saved_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  form_data TEXT NOT NULL,  -- JSON string of all form fields
  current_step INTEGER DEFAULT 0,
  last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(business_name, email)
);

CREATE INDEX IF NOT EXISTS idx_saved_onboarding_lookup
ON saved_onboarding(business_name, email);
```

#### 3. Update ClientIntakeForm Component

Add these features to `components/onboarding/ClientIntakeForm.tsx`:

```typescript
// Add new state
const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

// Save progress function
const saveProgress = async () => {
  try {
    const response = await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: formData.businessName,
        email: formData.email,
        formData,
        currentStep
      })
    });

    if (response.ok) {
      setLastSaved(new Date());
      toast({
        title: 'Progress Saved',
        description: 'Your onboarding progress has been saved'
      });
    }
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

// Load saved progress function
const loadSavedProgress = async (businessName: string, email: string) => {
  try {
    const response = await fetch(
      `/api/onboarding/save?businessName=${encodeURIComponent(businessName)}&email=${encodeURIComponent(email)}`
    );
    const data = await response.json();

    if (data.found) {
      setFormData(data.formData);
      setCurrentStep(data.currentStep);
      setLastSaved(new Date(data.lastSaved));

      toast({
        title: 'Progress Loaded',
        description: `Resumed from step ${data.currentStep + 1}`
      });
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
};

// Auto-save on step change
useEffect(() => {
  if (autoSaveEnabled && formData.businessName && formData.email) {
    const timer = setTimeout(() => {
      saveProgress();
    }, 2000); // Save 2 seconds after changes

    return () => clearTimeout(timer);
  }
}, [formData, currentStep, autoSaveEnabled]);
```

#### 4. Add UI Components

Add to the form header:

```typescript
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-4">
    {lastSaved && (
      <span className="text-sm text-muted-foreground">
        Last saved: {lastSaved.toLocaleTimeString()}
      </span>
    )}
  </div>

  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={saveProgress}
      disabled={!formData.businessName || !formData.email}
    >
      <Save className="h-4 w-4 mr-2" />
      Save Progress
    </Button>

    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const name = prompt('Enter business name:');
        const email = prompt('Enter email:');
        if (name && email) loadSavedProgress(name, email);
      }}
    >
      <FolderOpen className="h-4 w-4 mr-2" />
      Load Saved
    </Button>
  </div>
</div>
```

## Solution 2: Fix the Onboarding Orchestrator Error

The main issue is likely in the onboarding orchestrator service. Let me check what's failing:

### Check Database Connection

The orchestrator might be failing because:

1. **Database not initialized** - Run: `npm run db:init`
2. **Missing tables** - Ensure `company_portfolios` table exists
3. **Invalid data structure** - Portfolio data structure mismatch

### Quick Fix: Add Better Error Handling

Update `app/api/onboarding/start/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Received onboarding data:', {
      businessName: body.businessName,
      email: body.email,
      hasRequiredFields: {
        businessName: !!body.businessName,
        email: !!body.email,
        contactName: !!body.contactName,
        primaryGoals: Array.isArray(body.primaryGoals) && body.primaryGoals.length > 0,
        targetKeywords: Array.isArray(body.targetKeywords) && body.targetKeywords.length > 0,
        contentTypes: Array.isArray(body.contentTypes) && body.contentTypes.length > 0,
        selectedServices: Array.isArray(body.selectedServices) && body.selectedServices.length > 0
      }
    });

    // Validate required fields with detailed feedback
    const missing = [];
    if (!body.businessName) missing.push('businessName');
    if (!body.email) missing.push('email');
    if (!body.contactName) missing.push('contactName');
    if (!Array.isArray(body.primaryGoals) || body.primaryGoals.length === 0) missing.push('primaryGoals');
    if (!Array.isArray(body.targetKeywords) || body.targetKeywords.length === 0) missing.push('targetKeywords');
    if (!Array.isArray(body.contentTypes) || body.contentTypes.length === 0) missing.push('contentTypes');
    if (!Array.isArray(body.selectedServices) || body.selectedServices.length === 0) missing.push('selectedServices');

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missing.join(', ')}`,
          missingFields: missing
        },
        { status: 400 }
      );
    }

    // Start onboarding with detailed error catching
    try {
      const onboardingId = await onboardingOrchestrator.startOnboarding(body);

      return NextResponse.json({
        success: true,
        onboardingId,
        message: 'Onboarding started successfully'
      }, { status: 201 });

    } catch (orchestratorError: any) {
      console.error('Orchestrator error:', {
        message: orchestratorError.message,
        stack: orchestratorError.stack,
        data: body
      });

      return NextResponse.json(
        {
          error: 'Orchestrator failed',
          details: orchestratorError.message,
          hint: 'Check database connection and ensure company_portfolios table exists'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error starting onboarding:', error);
    return NextResponse.json(
      {
        error: 'Failed to start onboarding',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
```

## Testing Checklist

### Before Testing:
- [ ] Kill all Node processes
- [ ] Run `npm run db:init` to ensure database schema is current
- [ ] Verify `.env.local` has all required API keys
- [ ] Clear browser cache and cookies
- [ ] Restart dev server cleanly

### Test Steps:
1. [ ] Navigate to `/onboarding/new`
2. [ ] Fill in Business Info (Step 1)
3. [ ] Click "Save Progress" - verify toast shows "Progress Saved"
4. [ ] Continue to Step 2 (Website)
5. [ ] Refresh page
6. [ ] Click "Load Saved" - verify data restored
7. [ ] Complete all 5 steps
8. [ ] Click "Start Onboarding"
9. [ ] Check browser console for detailed error if it fails
10. [ ] Check server logs for orchestrator error details

## Quick Commands

```bash
# Kill Node processes
Get-Process node | Stop-Process -Force

# Initialize database
npm run db:init

# Start dev server
npm run dev

# Check server logs
# Look for console.log output in terminal
```

## Expected Behavior After Fix

### Save Button:
- ✅ Saves progress every 2 seconds (auto-save)
- ✅ Manual save button available
- ✅ Shows "Last saved" timestamp
- ✅ Can load saved progress by business name + email

### Start Onboarding:
- ✅ Creates company record in database
- ✅ Creates portfolio entry
- ✅ Triggers initial SEO audit
- ✅ Redirects to onboarding status page
- ✅ Shows success toast notification

## Next Steps

1. **Implement Save/Load feature** (Solution 1)
2. **Add detailed error logging** (Solution 2)
3. **Test with real data**
4. **Add progress indicator** (e.g., "3 of 5 steps completed")
5. **Add data validation** on each step before allowing Next

Would you like me to implement these fixes now?
