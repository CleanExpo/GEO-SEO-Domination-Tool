# White-Label Theming System (THEME-001)

**Phase 3: Polish & Scale**
**Status:** ✅ Complete
**Ticket:** THEME-001

## Overview

Per-tenant white-label theming system enabling organisations to customise:
- Colour schemes (primary, secondary, accent)
- Brand assets (logos, favicons)
- Typography (font families, heading fonts)
- UI preferences (border radius)
- Custom domains (preparation)

## Architecture

### Database Schema

**Table:** `organisation_themes`
- `organisation_id` - Foreign key to organisations (unique)
- `primary_colour`, `secondary_colour`, `accent_colour` - Hex colours with validation
- `logo_url`, `logo_dark_url`, `favicon_url` - Supabase Storage URLs
- `custom_domain` - For white-label hosting
- `font_family`, `heading_font_family` - Typography settings
- `border_radius` - UI preference (none, sm, md, lg, xl)

**Storage Bucket:** `organisation-branding`
- Public access for brand assets
- RLS policies for org admins only
- 5MB file size limit
- Supported formats: PNG, JPEG, SVG, WebP, ICO

### CSS Variable Generation

Themes are applied via CSS custom properties:

```css
:root {
  --primary: 160 84% 39%; /* HSL format for shadcn/ui */
  --secondary: 172 66% 50%;
  --accent: 217 91% 60%;
  --radius: 0.375rem;
  --font-family: Inter, system-ui, sans-serif;
}
```

### API Endpoints

**GET `/api/themes?organisationId={id}`**
- Fetch organisation theme
- Returns full theme configuration

**PUT `/api/themes`**
- Update organisation theme
- Body: `{ organisationId, updates: { primaryColour, ... } }`
- Validates hex colours before saving

**POST `/api/themes`**
- Reset theme to defaults
- Body: `{ organisationId, action: 'reset' }`

**POST `/api/themes/upload`**
- Upload brand assets (logo, logo-dark, favicon)
- FormData: `file`, `organisationId`, `type`
- Returns public URL

## Usage

### React Components

**ThemeProvider** - Apply theme to app:

```tsx
import { ThemeProvider } from '@/components/theme-provider';

function App({ organisationId }) {
  return (
    <ThemeProvider organisationId={organisationId}>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

**OrgLogo** - Display organisation logo:

```tsx
import { OrgLogo } from '@/components/theme-provider';

<OrgLogo variant="light" fallbackText="My Company" />
```

**ThemeCustomiser** - Interactive theme editor:

```tsx
import { ThemeCustomiser } from '@/components/theme-customizer';

<ThemeCustomiser
  organisationId={orgId}
  currentTheme={theme}
  onThemeUpdate={(newTheme) => console.log(newTheme)}
/>
```

### Service Layer

```typescript
import { ThemeManager } from '@/services/theme-manager';

const themeManager = new ThemeManager(supabaseUrl, supabaseKey);

// Fetch theme
const theme = await themeManager.getOrganisationTheme(orgId);

// Update colours
await themeManager.updateOrganisationTheme(orgId, {
  primaryColour: '#10b981',
  secondaryColour: '#14b8a6',
});

// Upload logo
const logoUrl = await themeManager.uploadBrandAsset(orgId, file, 'logo');
```

## Security

- **RLS Policies:** Org members can view, admins can modify
- **Colour Validation:** Regex check for valid hex format
- **File Upload:** MIME type validation, 5MB limit
- **Storage Isolation:** Brand assets scoped by organisation ID

## Migration

Migration: `005_theming_system.sql`

```bash
# Apply migration
npm run db:migrate

# Verify
psql -d your_db -c "SELECT * FROM organisation_themes;"
```

**Default Theme Created Automatically:**
- Trigger: `trigger_create_default_theme`
- Fires on organisation creation
- Uses emerald/teal colour scheme

## Australian English

All code uses Australian English spelling:
- `colour` (not color)
- `customisation` (not customization)
- `organisation` (not organization)

## Vercel Compatibility

✅ Supabase Storage for assets (no local filesystem)
✅ CSS-in-JS via style injection (no build-time theme files)
✅ API routes for server-side theme operations
✅ Edge-compatible (no Node.js dependencies)

## Testing

```bash
# Test theme API
curl -X GET "http://localhost:3000/api/themes?organisationId=xxx"

# Upload logo
curl -X POST http://localhost:3000/api/themes/upload \
  -F "file=@logo.png" \
  -F "organisationId=xxx" \
  -F "type=logo"

# Reset theme
curl -X POST http://localhost:3000/api/themes \
  -H "Content-Type: application/json" \
  -d '{"organisationId":"xxx","action":"reset"}'
```

## Future Enhancements

- Custom domain verification (DNS records)
- Advanced typography (Google Fonts integration)
- Dark mode colour overrides
- Theme preview in iframe
- Export/import theme configurations
- Theme marketplace

---

**Files Created:**
- `database/migrations/005_theming_system.sql`
- `services/theme-manager.ts`
- `app/api/themes/route.ts`
- `app/api/themes/upload/route.ts`
- `components/theme-provider.tsx`
- `components/theme-customizer.tsx`
- `docs/WHITE-LABEL-THEMING.md`
