# Supabase Integration

- Save URL + anon key in `/settings/integrations` (dev secrets file is gitignored).
- Use builder **supabase-setup** to inject `.env.local` and a ready client.
- Install `@supabase/supabase-js` in `web-app` after applying the builder.
- Health check hits `auth/v1/health` with anon key headers.
