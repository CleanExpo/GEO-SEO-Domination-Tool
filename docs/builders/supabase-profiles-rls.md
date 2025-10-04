# Builder: supabase-profiles-rls

Creates a user profiles table with Row Level Security policies and automatic profile creation trigger.

**Variables**
- `SCHEMA_NAME` (optional) — defaults to `public`
- `TABLE_NAME` (optional) — defaults to `profiles`

**Requires**
- Supabase project with authentication enabled
- Database access (SQL Editor or migration system)

**Generated Files**
- `supabase/migrations/<timestamp>_profiles_rls.sql` — Migration file with table, RLS policies, and triggers

**Features**
- **Profiles Table**: Links to `auth.users` via UUID foreign key
- **Auto-creation Trigger**: Creates profile automatically when user signs up
- **RLS Policies**: Users can only view/update/insert their own profile
- **Auto-updated Timestamps**: `updated_at` field automatically updates on changes

**Table Schema**
```sql
profiles (
  id UUID PRIMARY KEY (references auth.users),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**RLS Policies**
- `Users can view own profile` — SELECT only where `auth.uid() = id`
- `Users can update own profile` — UPDATE only where `auth.uid() = id`
- `Users can insert own profile` — INSERT only where `auth.uid() = id`

**Setup**
1. Apply builder to generate migration file
2. Run migration in Supabase SQL Editor or via CLI:
   ```bash
   supabase db push
   ```
3. Verify RLS is enabled:
   ```sql
   SELECT * FROM pg_tables WHERE tablename = 'profiles';
   ```

**Testing**
- Sign up a new user via auth UI
- Check that profile was automatically created
- Try to access another user's profile (should be blocked by RLS)
