# Company Context System

## Overview

The GEO-SEO Domination Tool uses a **three-tier data isolation** architecture:

```
User → Organisation → Companies → CRM/SEO Data
```

1. **User Level**: Authentication and user profile
2. **Organisation Level**: Team/billing entity (multi-user collaboration)
3. **Company Level**: Individual client businesses being managed

This ensures that:
- **Organisations** provide team collaboration and billing boundaries
- **Companies** provide data isolation for each client business
- **CRM data** (contacts, deals, tasks) is scoped to specific companies
- **SEO data** (audits, keywords, rankings) is scoped to specific companies

## Architecture

### Database Schema

All CRM and SEO tables have both `organisation_id` and `company_id`:

```sql
-- CRM Tables
crm_contacts (id, name, email, organisation_id, company_id, ...)
crm_deals (id, title, value, organisation_id, company_id, ...)
crm_tasks (id, title, due_date, organisation_id, company_id, ...)
crm_calendar_events (id, title, event_date, organisation_id, company_id, ...)

-- SEO Tables
companies (id, name, website, organisation_id, ...)
keywords (id, keyword, location, organisation_id, company_id, ...)
rankings (id, rank, date, organisation_id, company_id, ...)
audits (id, scores, organisation_id, company_id, ...)
```

### Context Hierarchy

1. **Tenant Context** (`lib/tenant-context.ts`):
   - Gets current user's organisation
   - Ensures all data belongs to user's organisation
   - Functions: `getCurrentOrganisationId()`, `getCurrentOrganisation()`

2. **Company Context** (`lib/company-context.ts`):
   - Gets active company within organisation
   - Scopes all operations to specific company
   - Functions: `getActiveCompanyId()`, `getActiveCompany()`

3. **Active Company Cookie**:
   - Stores user's currently selected company
   - Cookie name: `active_company_id`
   - Persists for 1 year
   - Falls back to first company if not set

## Implementation

### Step 1: Run Database Migration

Execute `MIGRATION_009_COMPANY_CONTEXT.sql` in Supabase SQL Editor:

```sql
-- Adds company_id to all CRM tables
ALTER TABLE crm_contacts ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE crm_deals ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE crm_tasks ADD COLUMN company_id UUID REFERENCES companies(id);
-- ... etc
```

### Step 2: Use Company Context in API Routes

**Pattern for ALL CRM and SEO API routes:**

```typescript
import { getUser } from '@/lib/auth/supabase-server';
import { getCurrentOrganisationId } from '@/lib/tenant-context';
import { getActiveCompanyId } from '@/lib/company-context';

export async function GET() {
  // 1. Verify authentication
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get organisation context (team boundary)
  const organisationId = await getCurrentOrganisationId();

  // 3. Get company context (client boundary)
  const companyId = await getActiveCompanyId();

  // 4. Query with BOTH scopes
  const { data } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('organisation_id', organisationId)  // Team filter
    .eq('company_id', companyId);           // Company filter

  return NextResponse.json({ contacts: data });
}

export async function POST(request) {
  const user = await getUser();
  const organisationId = await getCurrentOrganisationId();
  const companyId = await getActiveCompanyId();

  const body = await request.json();

  // Insert with BOTH IDs
  const { data } = await supabase
    .from('crm_contacts')
    .insert([{
      ...body,
      user_id: user.id,
      organisation_id: organisationId,
      company_id: companyId
    }])
    .select()
    .single();

  return NextResponse.json({ contact: data }, { status: 201 });
}
```

### Step 3: Add Company Selector to UI

**In your layout or header:**

```tsx
import { CompanySelector } from '@/components/CompanySelector';

export default function Layout({ children }) {
  return (
    <div>
      <header>
        <CompanySelector />
      </header>
      <main>{children}</main>
    </div>
  );
}
```

The component will:
- Display current active company
- Show dropdown of all companies in organisation
- Switch active company and reload page

### Step 4: Company Switching API

**POST `/api/company/switch`** - Switch active company

```typescript
await fetch('/api/company/switch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ companyId: 'company-uuid' })
});
```

**GET `/api/company/switch`** - Get active company

```typescript
const res = await fetch('/api/company/switch');
const { activeCompanyId } = await res.json();
```

## Use Cases

### Multi-Company Agency

**Scenario**: SEO agency managing 10 client businesses

**Structure**:
- 1 Organisation (the agency)
- 10 Companies (each client business)
- Contacts belong to specific companies
- Campaigns belong to specific companies
- Team members can switch between companies

### Freelancer with Multiple Clients

**Scenario**: Freelancer managing 3 client businesses

**Structure**:
- 1 Organisation (personal org)
- 3 Companies (each client)
- All data scoped to specific companies

### Enterprise Multi-Brand

**Scenario**: Corporation with multiple brands

**Structure**:
- 1 Organisation (corporation)
- 5 Companies (each brand)
- Different teams work on different brands
- Data isolated between brands

## Migration Path

### Existing Data Without company_id

After running Migration 009, existing records will have `NULL` company_id. Options:

**Option 1: Assign to First Company**

```sql
UPDATE crm_contacts
SET company_id = (
  SELECT id FROM companies
  WHERE organisation_id = crm_contacts.organisation_id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE company_id IS NULL;
```

**Option 2: Create Default Company**

```sql
-- Create "Default Company" for each organisation
INSERT INTO companies (name, website, organisation_id)
SELECT 'Default Company', 'https://example.com', id
FROM organisations
WHERE NOT EXISTS (
  SELECT 1 FROM companies WHERE organisation_id = organisations.id
);

-- Assign all NULL records to default company
UPDATE crm_contacts
SET company_id = (
  SELECT id FROM companies
  WHERE name = 'Default Company'
  AND organisation_id = crm_contacts.organisation_id
)
WHERE company_id IS NULL;
```

## API Routes to Update

All routes that query these tables need company scoping:

### CRM Routes
- ✅ `/api/crm/contacts` - Updated with company scoping
- ⏳ `/api/crm/deals`
- ⏳ `/api/crm/tasks`
- ⏳ `/api/crm/calendar`
- ⏳ `/api/crm/projects`

### SEO Routes
- ⏳ `/api/keywords`
- ⏳ `/api/rankings`
- ⏳ `/api/audits`
- `/api/companies` - Already has organisation scoping

### Other Routes
- ⏳ `/api/github/sync` - Needs company scoping
- ⏳ `/api/integrations/...` - Check if company-specific

## Testing

### Test Multi-Company Workflow

1. **Create 2 companies** in same organisation
2. **Add contact** to Company A
3. **Switch to Company B** via selector
4. **Verify contact** from Company A is NOT visible
5. **Add contact** to Company B
6. **Switch back to Company A**
7. **Verify** only Company A contacts visible

### Test Edge Cases

1. **No companies** - Should show "Create company" prompt
2. **Company deleted** - Should switch to another company
3. **User removed from organisation** - Should clear cookie
4. **Switching organisations** - Should reset active company

## Security Considerations

### Row-Level Security (RLS)

Add RLS policies to Supabase:

```sql
-- Companies: Users can only see companies in their organisation
CREATE POLICY "Users see own organisation companies"
ON companies FOR SELECT
USING (
  organisation_id IN (
    SELECT organisation_id FROM organisation_members
    WHERE user_id = auth.uid()
  )
);

-- CRM Contacts: Users can only see contacts in their organisation's companies
CREATE POLICY "Users see own organisation contacts"
ON crm_contacts FOR SELECT
USING (
  organisation_id IN (
    SELECT organisation_id FROM organisation_members
    WHERE user_id = auth.uid()
  )
);
```

### API Validation

Every API route MUST:
1. ✅ Verify user authentication
2. ✅ Verify organisation membership
3. ✅ Verify company belongs to organisation
4. ✅ Filter queries by BOTH organisation_id AND company_id

## Future Enhancements

### Company Permissions

Add company-level roles:

```sql
CREATE TABLE company_members (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK(role IN ('manager', 'editor', 'viewer')),
  UNIQUE(company_id, user_id)
);
```

### Company Settings

Per-company configuration:

```sql
ALTER TABLE companies ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;

-- Example settings:
{
  "timezone": "America/New_York",
  "currency": "USD",
  "reporting_frequency": "weekly",
  "notification_preferences": {...}
}
```

### Bulk Operations

Switch companies for bulk operations:

```typescript
// Process all companies in organisation
const companies = await getUserCompanies();
for (const company of companies) {
  await withCompanyScope(company.id, async (companyId) => {
    // Perform operation for this company
  });
}
```

## Support

For questions or issues with company context system:
1. Check this documentation
2. Review implementation in `lib/company-context.ts`
3. See example in `app/api/crm/contacts/route.ts`
4. Test with CompanySelector component
