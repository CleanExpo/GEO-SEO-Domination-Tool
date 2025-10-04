# Multi-Tenant Workspaces

This feature adds multi-tenant workspace support with row-level security, allowing users to create and manage isolated workspaces with team collaboration.

## Overview

The **multi-tenant-workspaces** blueprint creates:
1. **workspace-schema** → Database tables (workspaces, memberships, projects) with RLS
2. **workspace-pages** → UI for creating/listing/switching workspaces + API routes

## Features

### Database Schema
- **Workspaces**: Isolated containers for projects and data
- **Workspace Memberships**: User roles (owner, admin, member, viewer) per workspace
- **Projects**: Workspace-scoped projects
- **RLS Policies**: Automatic access control based on membership

### User Interface
- **/workspaces** page to create and manage workspaces
- Active workspace indicator and switching
- Role-based UI (owner/admin/member badges)

### API Routes
- `GET /api/workspaces` → List user's workspaces
- `POST /api/workspaces` → Create workspace (auto-sets as active)
- `PUT /api/workspaces` → Switch active workspace

### Helper Utilities
- `getActiveWorkspaceId()` → Read active workspace from cookie (server-side)
- `active_workspace` cookie → Track current workspace context

## Prerequisites

### Supabase Setup
- Supabase project with authentication enabled
- Database access via SQL Editor or CLI

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
2. Select "Multi-Tenant Workspaces"
3. Click "Preview Blueprint"
4. Click "Apply Blueprint"

### Via MCP Server
```bash
call_mcp apply_blueprint --id multi-tenant-workspaces
```

## Generated Files

### Database Schema
- `database/supabase/workspaces.sql` — Tables, RLS policies, and triggers

### Application Files
- `web-app/app/workspaces/page.tsx` — Workspaces management page
- `web-app/app/api/workspaces/route.ts` — API endpoints
- `web-app/lib/workspace.ts` — Helper utilities

### Documentation
- `docs/builders/workspace-schema.md`
- `docs/builders/workspace-pages.md`

## Setup Steps

### 1. Apply the Blueprint
Use Blueprints UI or MCP server to generate all files.

### 2. Run Database Migration
Copy SQL from `database/supabase/workspaces.sql` and run in Supabase SQL Editor:

```sql
-- Creates 3 tables: workspaces, workspace_memberships, projects
-- Enables RLS on all tables
-- Creates helper function: user_in_workspace()
-- Creates policies for role-based access
-- Creates trigger to auto-add owner membership
```

Verify tables were created:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%workspace%';
```

Expected output:
```
workspaces
workspace_memberships
projects
```

### 3. Start Development Server
```bash
npm run dev -w web-app
```

## Testing

### Create First Workspace
1. Sign in to your application
2. Navigate to `/workspaces`
3. Fill in the "Create Workspace" form:
   - **Name**: Client ACME (required)
   - **Slug**: acme (optional, defaults to "main")
4. Click "Create"
5. New workspace appears in table with "owner" role
6. Active workspace indicator updates

### Verify Database
Check Supabase Table Editor:

**Workspaces table**:
```sql
SELECT * FROM workspaces;
```
Should show your new workspace with your user ID as `owner_id`.

**Memberships table**:
```sql
SELECT * FROM workspace_memberships;
```
Should show an entry with `role = 'owner'` for your user.

### Test Workspace Switching
1. Create a second workspace
2. Click "Set Active" on the first workspace
3. Page reloads, active indicator updates
4. Cookie `active_workspace` is set to selected workspace ID

### Test Role-Based Access

#### As Workspace Owner
```sql
-- Manually verify you can see workspace
SELECT * FROM workspaces WHERE id = 'your-workspace-id';
-- Should return the workspace

-- Try updating workspace
UPDATE workspaces SET name = 'Updated Name' WHERE id = 'your-workspace-id';
-- Should succeed
```

#### As Non-Member
Create a second user account, sign in, and try:
```sql
SELECT * FROM workspaces WHERE id = 'first-users-workspace-id';
-- Should return empty (RLS blocks access)
```

## Database Schema Details

### Tables

#### workspaces
```sql
id          uuid primary key
name        text not null
slug        text unique
owner_id    uuid references auth.users
created_at  timestamptz
updated_at  timestamptz
```

#### workspace_memberships
```sql
workspace_id  uuid references workspaces
user_id       uuid references auth.users
role          text check in (owner, admin, member, viewer)
created_at    timestamptz
primary key   (workspace_id, user_id)
```

#### projects
```sql
id            uuid primary key
workspace_id  uuid references workspaces
name          text not null
description   text
created_at    timestamptz
```

### RLS Policies

#### Workspaces
- **SELECT**: Members can view workspace
- **INSERT**: Users can create workspace (owner_id = auth.uid())
- **UPDATE**: Owner/admin can update workspace
- **DELETE**: Owner can delete workspace

#### Memberships
- **SELECT**: Members can view memberships
- **INSERT**: Owner/admin can add members
- **UPDATE**: Owner/admin can update member roles
- **DELETE**: Owner/admin can remove members

#### Projects
- **SELECT**: Members can view projects
- **INSERT**: Owner/admin can create projects
- **UPDATE**: Owner/admin can update projects
- **DELETE**: Owner/admin can delete projects

### Helper Function
```sql
user_in_workspace(w_id uuid) returns boolean
```
Returns true if current user (`auth.uid()`) is a member of workspace `w_id`.

### Trigger
```sql
workspaces_owner_membership
```
After workspace insert, automatically adds creator to `workspace_memberships` with `role = 'owner'`.

## Usage Patterns

### Reading Active Workspace (Server)
```typescript
// In a server component or API route
import { getActiveWorkspaceId } from '@/lib/workspace';

export default async function MyPage(){
  const workspaceId = getActiveWorkspaceId();

  if (!workspaceId){
    return <div>No active workspace selected</div>;
  }

  // Fetch workspace-scoped data
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId);

  return <div>{/* render projects */}</div>;
}
```

### Scoping Queries to Active Workspace
```typescript
// API route example
import { getActiveWorkspaceId } from '@/lib/workspace';
import { createServerClient } from '@supabase/ssr';

export async function GET(){
  const workspaceId = getActiveWorkspaceId();
  if (!workspaceId) return Response.json({ error: 'No workspace' }, { status: 400 });

  const supa = createServerClient(/*...*/);
  const { data } = await supa
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId);

  return Response.json({ data });
}
```

### Adding Members to Workspace
```typescript
// POST /api/workspaces/[id]/members
export async function POST(req: Request, { params }: { params: { id: string } }){
  const { email, role } = await req.json();

  // 1. Find user by email
  const { data: profile } = await supa
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!profile) return Response.json({ error: 'User not found' }, { status: 404 });

  // 2. Add membership (RLS verifies current user is owner/admin)
  const { error } = await supa
    .from('workspace_memberships')
    .insert({
      workspace_id: params.id,
      user_id: profile.id,
      role: role || 'member'
    });

  return Response.json({ ok: !error });
}
```

### Client-Side Workspace Selection
```typescript
'use client';
import { useState } from 'react';

export function WorkspaceSwitcher({ workspaces, activeId }: any){
  async function switchWorkspace(id: string){
    await fetch('/api/workspaces', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    window.location.reload(); // Refresh to apply new workspace context
  }

  return (
    <select onChange={(e) => switchWorkspace(e.target.value)} value={activeId}>
      {workspaces.map((w: any) => (
        <option key={w.id} value={w.id}>{w.name}</option>
      ))}
    </select>
  );
}
```

## Extending the System

### Add Custom Fields to Workspaces
```sql
ALTER TABLE workspaces
  ADD COLUMN settings JSONB DEFAULT '{}',
  ADD COLUMN logo_url TEXT,
  ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise'));
```

### Add Team Billing
```sql
CREATE TABLE workspace_subscriptions (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  status TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspace_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view subscription"
  ON workspace_subscriptions
  FOR SELECT
  USING (public.user_in_workspace(workspace_id));

CREATE POLICY "Owner can manage subscription"
  ON workspace_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_id = workspace_subscriptions.workspace_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );
```

### Add Workspace Invitations
```sql
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invitations"
  ON workspace_invitations
  FOR SELECT
  USING (public.user_in_workspace(workspace_id));

CREATE POLICY "Owner/admin can create invitations"
  ON workspace_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_id = workspace_invitations.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
```

### Add Workspace Activity Log
```sql
CREATE TABLE workspace_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspace_activity_workspace ON workspace_activity(workspace_id, created_at DESC);

ALTER TABLE workspace_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activity"
  ON workspace_activity
  FOR SELECT
  USING (public.user_in_workspace(workspace_id));
```

## Security Considerations

### RLS Policy Ordering
- Policies use OR logic - any matching policy grants access
- `user_in_workspace()` helper ensures consistent membership checks
- Always verify role requirements in policies (owner/admin vs member)

### Cookie Security
- `active_workspace` cookie is `httpOnly: false` for client-side reading
- Cookie is `sameSite: lax` to prevent CSRF
- Always validate workspace access server-side (don't trust cookie alone)

### Preventing Orphaned Workspaces
- `ON DELETE CASCADE` removes memberships when workspace deleted
- Owner deletion cascades to workspace deletion
- Consider archiving instead of deleting for audit trail

### Role Validation
```typescript
// Server-side role check
async function requireRole(workspaceId: string, allowedRoles: string[]){
  const supa = createServerClient(/*...*/);
  const { data: { user } } = await supa.auth.getUser();

  const { data } = await supa
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user!.id)
    .single();

  if (!data || !allowedRoles.includes(data.role)){
    throw new Error('Insufficient permissions');
  }
}

// Usage
await requireRole(workspaceId, ['owner', 'admin']);
```

## Troubleshooting

### "No workspaces yet" despite creating one
- Check Supabase Table Editor → workspaces table
- Verify RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'workspaces'`
- Check that your user is authenticated
- Review browser console for errors

### Can't see workspace after creation
- Verify trigger created membership: `SELECT * FROM workspace_memberships WHERE user_id = auth.uid()`
- Check RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'workspaces'`
- Ensure user is authenticated when creating workspace

### "Active workspace: none" after setting
- Check browser cookies for `active_workspace`
- Verify cookie is being set in API response
- Check for JavaScript errors preventing cookie write
- Try hard refresh (Ctrl+Shift+R)

### Other user's workspace visible
- **Security issue!** Check RLS is enabled
- Verify `user_in_workspace()` function exists and works
- Review policies - should use `user_in_workspace(id)` or membership checks

## Production Deployment

### Environment Variables (Vercel)
Add to Vercel Dashboard > Settings > Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Database Migration
Run the workspaces SQL in production Supabase project:
1. Copy contents of `database/supabase/workspaces.sql`
2. Open production Supabase SQL Editor
3. Paste and execute
4. Verify tables created

### Security Checklist
- ✅ RLS enabled on all workspace tables
- ✅ All policies tested with different roles
- ✅ Helper function `user_in_workspace()` created
- ✅ Trigger `workspaces_owner_membership` active
- ✅ No raw SQL queries bypass RLS
- ✅ Active workspace validated server-side
- ✅ Role checks in place for sensitive operations

## Next Steps

### Add Workspace Settings Page
```typescript
// app/workspaces/[id]/settings/page.tsx
export default async function WorkspaceSettings({ params }: { params: { id: string } }){
  const supa = createServerClient(/*...*/);

  // Fetch workspace (RLS ensures user has access)
  const { data: workspace } = await supa
    .from('workspaces')
    .select('*')
    .eq('id', params.id)
    .single();

  // Update form, delete button, etc.
}
```

### Add Team Members UI
Create `/workspaces/[id]/members` page with:
- List of current members with roles
- Invite form (email + role selector)
- Remove member button (owner/admin only)
- Role change dropdown

### Scope Existing Features
Update existing features to respect workspace context:
```typescript
// Before
const { data } = await supa.from('builds').select('*');

// After
const workspaceId = getActiveWorkspaceId();
const { data } = await supa
  .from('builds')
  .select('*')
  .eq('workspace_id', workspaceId);
```

### Add Workspace-Level Permissions
Extend beyond role-based to feature-based permissions:
```sql
CREATE TABLE workspace_permissions (
  workspace_id UUID REFERENCES workspaces(id),
  role TEXT NOT NULL,
  feature TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  PRIMARY KEY (workspace_id, role, feature)
);
```

## References

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenancy with RLS](https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
