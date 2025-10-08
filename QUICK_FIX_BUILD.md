# Quick Fix for Build Issues

## 1. Create .env.local with OpenRouter API Key

Create a `.env.local` file in the root directory with:

```bash
# DeepSeek via OpenRouter (recommended)
OPENROUTER_API=your_openrouter_api_key_here

# OR Direct DeepSeek API (if you have it)
# DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Optional: Sentry (for error tracking)
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
# SENTRY_AUTH_TOKEN=your_auth_token_here
# SENTRY_ORG=your_org_slug
# SENTRY_PROJECT=your_project_slug

# Other required APIs (add as needed)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

## 2. Get OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up/login
3. Go to "Keys" section
4. Create a new API key
5. Copy the key and add it as `OPENROUTER_API` in `.env.local`

## 3. Test the Build

```bash
npm run build
```

## Note

The system now supports both:
- **OpenRouter API** (via `OPENROUTER_API` env var) - **RECOMMENDED**
- **Direct DeepSeek API** (via `DEEPSEEK_API_KEY` env var)

OpenRouter is recommended because it provides better reliability and access to multiple models including DeepSeek V3.

## Model Usage

When using OpenRouter, the system will use `deepseek/deepseek-chat` model.
When using direct DeepSeek API, it will use `deepseek-chat` model.

This is handled automatically by the new `@/lib/deepseek-config.ts` module.