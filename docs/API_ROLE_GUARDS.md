# API Role Guards

Use `guard(req, { allowed: ['pro','admin'] })` in any route handler to enforce roles.

**Example**
```ts
import { guard, requireMethod } from '@/lib/apiGuard';
export async function POST(req: NextRequest){
  const m = requireMethod(req, ['POST']); if (m) return m;
  const g = await guard(req, { allowed: ['pro','admin'] }); if (g) return g;
  // ...secure work...
  return NextResponse.json({ ok:true });
}
```

- Roles come from your existing `/api/roles` endpoint.
- Returns `{ ok:false, error:'forbidden', role }` with `403` when blocked.
- Use `requireMethod(req, ['POST'])` for quick method checks.
