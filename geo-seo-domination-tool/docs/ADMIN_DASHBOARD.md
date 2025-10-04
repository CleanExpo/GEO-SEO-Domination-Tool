# Admin Dashboard

Complete admin system for managing users and roles in your Supabase-powered Next.js application.

## Overview

The **admin-complete** blueprint creates a full admin dashboard with:
1. **supabase-profiles-role** → Adds `role` column to profiles table
2. **supabase-admin-role** → Adds admin role support and RLS policies
3. **admin-dashboard-page** → Protected admin UI showing all users
4. **admin-users-api** → API routes for role updates and statistics

## Prerequisites

### Supabase Setup
- Profiles table must exist (use `supabase-profiles-rls` builder first)
- Authentication enabled in Supabase project

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Package Installation
```bash
npm i -w web-app @supabase/supabase-js @supabase/ssr
```

## Apply the Blueprint

### Via Blueprints UI
1. Navigate to `/projects/blueprints`
2. Select "Admin Dashboard Complete"
3. Click "Preview Blueprint"
4. Click "Apply Blueprint"

### Via MCP Server
```bash
call_mcp apply_blueprint --id admin-complete
```

## Generated Files

### Database Migrations
- `database/supabase/profiles_role.sql` — Adds role column (free/pro/admin)
- `database/supabase/profiles_admin_policies.sql` — Admin RLS policies and helper function

### Application Files
- `web-app/app/admin/page.tsx` — Admin dashboard page
- `web-app/app/api/admin/update-role/route.ts` — Update user role endpoint
- `web-app/app/api/admin/stats/route.ts` — User statistics endpoint

### Documentation
- `docs/builders/supabase-profiles-role.md`
- `docs/builders/supabase-admin-role.md`
- `docs/builders/admin-dashboard-page.md`
- `docs/builders/admin-users-api.md`

## Setup Steps

### 1. Apply the Blueprint
Use Blueprints UI or MCP server to generate all files.

### 2. Run Database Migrations

#### Step 1: Add Role Column
Copy SQL from `database/supabase/profiles_role.sql` and run in Supabase SQL Editor:
```sql
alter table if exists public.profiles
  add column if not exists role text not null default 'free';

create index if not exists idx_profiles_role
  on public.profiles(role);
```

#### Step 2: Add Admin Policies
Copy SQL from `database/supabase/profiles_admin_policies.sql` and run:
```sql
-- Update role constraint to allow admin
alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add constraint profiles_role_check
  check (role in ('free', 'pro', 'admin'));

-- RLS Policy: Admins can view all profiles
create policy if not exists "Admins can view all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policy: Admins can update all profiles
create policy if not exists "Admins can update all profiles"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Helper function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;
```

Verify policies were created:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 3. Promote First Admin User
Manually set a user to admin role:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

Replace `admin@example.com` with your email address.

### 4. Start Development Server
```bash
npm run dev -w web-app
```

## Testing

### Access Admin Dashboard
1. Sign in with the admin user account
2. Navigate to `/admin`
3. You should see the admin dashboard with all users

### Test Role Updates
1. In the admin dashboard, find a user in the table
2. Change their role using the dropdown
3. Click "Update"
4. Page should reload and show the updated role

### Test Non-Admin Access
1. Sign in with a non-admin user (role = 'free' or 'pro')
2. Navigate to `/admin`
3. You should see "Access Denied" message

### Test API Endpoints

#### Get Statistics
```bash
curl http://localhost:3000/api/admin/stats \
  -H "Cookie: sb-access-token=..." \
  -H "Cookie: sb-refresh-token=..."
```

Response:
```json
{
  "ok": true,
  "stats": {
    "total": 10,
    "free": 5,
    "pro": 4,
    "admin": 1,
    "newThisWeek": 2
  }
}
```

#### Update Role
```bash
curl -X POST http://localhost:3000/api/admin/update-role \
  -H "Cookie: sb-access-token=..." \
  -d "userId=uuid-here&role=pro"
```

## Admin Dashboard Features

### User Table
- **Email**: User's email address
- **Name**: Full name (if set in profile)
- **Role**: Current role with color-coded badge
  - Gray badge: free
  - Green badge: pro
  - Purple badge: admin
- **Created**: Account creation date
- **Actions**: Inline role update form

### Statistics Cards
- **Total Users**: Count of all users
- **Pro Users**: Count of pro-tier users (green)
- **Admins**: Count of admin users (purple)

### Role Management
- Dropdown to select new role (free/pro/admin)
- Update button to submit change
- Automatic page reload after update

## Row Level Security (RLS)

### Admin Policies

The admin system uses RLS policies to control access:

#### "Admins can view all profiles"
```sql
for select using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
)
```
Allows admins to SELECT all rows in profiles table.

#### "Admins can update all profiles"
```sql
for update using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
)
```
Allows admins to UPDATE any row in profiles table.

### Helper Function: `is_admin()`
```sql
create function is_admin() returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$
```

Use in other policies:
```sql
-- Example: Allow admins to delete posts
create policy "Admins can delete posts"
  on posts for delete
  using (public.is_admin());
```

## Customization

### Add More Admin Endpoints

#### Delete User
```typescript
// app/api/admin/delete-user/route.ts
export async function DELETE(req: Request){
  // Verify admin auth
  const { userId } = await req.json();

  const { error } = await supa.auth.admin.deleteUser(userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
```

#### Bulk Role Update
```typescript
// app/api/admin/bulk-update/route.ts
export async function POST(req: Request){
  const { userIds, role } = await req.json();

  const { error } = await supa
    .from('profiles')
    .update({ role })
    .in('id', userIds);

  return Response.json({ ok: !error });
}
```

### Add Search and Filters
```typescript
// app/admin/page.tsx
const [search, setSearch] = useState('');

const filteredProfiles = allProfiles?.filter(p =>
  p.email.toLowerCase().includes(search.toLowerCase()) ||
  p.full_name?.toLowerCase().includes(search.toLowerCase())
);

// Add search input
<input
  type="text"
  placeholder="Search users..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="border rounded px-3 py-2"
/>
```

### Add Pagination
```typescript
const ITEMS_PER_PAGE = 20;
const [page, setPage] = useState(0);

const paginatedProfiles = allProfiles?.slice(
  page * ITEMS_PER_PAGE,
  (page + 1) * ITEMS_PER_PAGE
);

// Add pagination controls
<div className="flex gap-2">
  <button onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button>
  <button onClick={() => setPage(p => p + 1)}>Next</button>
</div>
```

### Add Audit Logging
Create an admin_audit_log table:
```sql
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text not null,
  target_user_id uuid references profiles(id),
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- Log role changes
create or replace function log_role_change()
returns trigger as $$
begin
  if OLD.role is distinct from NEW.role then
    insert into admin_audit_log (admin_id, action, target_user_id, old_value, new_value)
    values (
      auth.uid(),
      'role_change',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_profile_role_change
  before update on profiles
  for each row
  execute function log_role_change();
```

## Security Considerations

### Admin Authentication
- Always verify `role = 'admin'` on server before granting access
- Use server components for sensitive operations
- Never trust client-side role checks alone

### RLS Policy Ordering
- RLS policies are evaluated with OR logic
- "Users can view own profile" + "Admins can view all profiles" = both work
- Ensure policies don't conflict or create security holes

### Preventing Admin Lock-Out
- Keep at least one admin account active
- Add safeguard in update endpoint:
  ```typescript
  // Prevent removing last admin
  const adminCount = await supa.from('profiles').select('id', { count: 'exact' }).eq('role', 'admin');
  if (adminCount.count === 1 && currentRole === 'admin' && newRole !== 'admin') {
    return Response.json({ error: 'Cannot remove last admin' }, { status: 400 });
  }
  ```

### Rate Limiting
Add rate limiting to admin endpoints:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m')
});

const { success } = await ratelimit.limit(user.id);
if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });
```

## Troubleshooting

### "Access Denied" for admin user
- Verify user's role in Supabase Table Editor
- Check that admin RLS policies were created (`SELECT * FROM pg_policies`)
- Clear browser cache and sign out/in again

### Role update not working
- Check browser console for errors
- Verify form data is being sent correctly
- Check Supabase logs for permission errors
- Ensure admin RLS update policy exists

### Can't see other users in dashboard
- Verify admin RLS SELECT policy was created
- Check that current user has `role = 'admin'`
- Ensure RLS is enabled on profiles table

### "is_admin() function does not exist"
- Run the admin policies migration SQL
- Verify function was created: `SELECT * FROM pg_proc WHERE proname = 'is_admin'`

## Production Deployment

### Environment Variables (Vercel)
Add Supabase credentials to Vercel environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Database Migrations
Run all migration SQL in production Supabase project:
1. Role column migration
2. Admin policies migration
3. Promote first admin user

### Security Checklist
- ✅ RLS enabled on profiles table
- ✅ Admin policies created and tested
- ✅ At least one admin user exists
- ✅ Admin endpoints verify role on server
- ✅ Sensitive operations use server components
- ✅ Rate limiting configured (optional but recommended)
- ✅ Audit logging enabled (optional)

### Monitoring
- Monitor admin actions via audit log table
- Set up alerts for suspicious role changes
- Track admin login activity
- Log failed authentication attempts

## Next Steps

### Add More Admin Features
- User search and advanced filtering
- Bulk operations (delete, role update)
- User activity logs
- Email notification system
- Export users to CSV
- User impersonation for support

### Extend Role System
- Add custom roles (moderator, support, etc.)
- Implement permission-based access (not just role-based)
- Create role hierarchy
- Add role expiration dates

### Improve UI
- Add charts and analytics
- Implement real-time updates (Supabase Realtime)
- Add dark mode
- Improve responsive design
- Add keyboard shortcuts

## References

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [@supabase/ssr Package](https://github.com/supabase/ssr)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
