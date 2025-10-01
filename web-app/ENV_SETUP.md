# Environment Variables Setup

Your Vercel environment variables are already configured. Good job!

## Current Variables in Vercel:
- PERPLEXITY_API_KEY ✅
- FIRECRAWL_API_KEY ✅
- GOOGLE_API_KEY ✅
- ANTHROPIC_API_KEY ✅
- SEMRUSH_API_KEY ✅

## Important Notes:

### For Server-Side API Routes (api/*.ts):
These variables are already correctly named and will work in Vercel Functions.
Access them with: `process.env.PERPLEXITY_API_KEY`

### For Client-Side Code (src/**/*.tsx):
If you need to access any API keys from the browser, you must:
1. Add them again with `VITE_` prefix in Vercel Dashboard
2. Access them with: `import.meta.env.VITE_API_KEY_NAME`

**Security Best Practice:**
- Keep API keys in server-side functions only
- Never expose them in client-side code
- Use the `/api` routes to make API calls from the frontend

## Next Steps:
1. Deploy the web-app to Vercel
2. The environment variables will automatically be available
3. No changes needed to your current Vercel environment setup
