# Gemini 2.5 Computer Use - Setup Guide

## Step 1: Get Google AI API Key

### Option A: Google AI Studio (Recommended for Development)

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API Key"** in the left sidebar
4. Click **"Create API key"**
5. Select **"Create API key in new project"** (or use existing project)
6. Copy the API key (starts with `AIza...`)

### Option B: Google Cloud Vertex AI (For Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing: `geo-seo-domination-tool`
3. Enable **Vertex AI API**:
   - Search for "Vertex AI API" in the search bar
   - Click **Enable**
4. Create service account credentials:
   - Go to **IAM & Admin** > **Service Accounts**
   - Click **Create Service Account**
   - Name: `gemini-computer-use`
   - Grant role: **Vertex AI User**
   - Click **Create Key** > **JSON**
   - Download and save securely

## Step 2: Add API Key to Environment Variables

Add to your `.env` file:

```env
# Gemini Computer Use API
GEMINI_API_KEY=AIza...your-api-key-here

# Optional: Vertex AI (if using Google Cloud)
GOOGLE_CLOUD_PROJECT_ID=geo-seo-domination-tool
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Step 3: Verify Your Project ID

Your Google Cloud project: `geo-seo-domination-tool`
Project ID: `prj_JxdLiaHoWpnXWEjEhXXpmo0eFBgQ` (Vercel)

For Vertex AI, use the Google Cloud project ID instead.

## Security Notes

- ✅ **NEVER commit API keys to Git**
- ✅ `.env` is already in `.gitignore`
- ✅ Use environment variables only
- ✅ Rotate keys regularly
- ✅ Enable API key restrictions in Google Cloud Console

## Next Steps

After obtaining your API key, run:

```bash
npm install
npm run test:gemini-computer-use
```

This will verify your setup and run a safe test automation.
