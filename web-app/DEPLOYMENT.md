# Deploying GEO-SEO Domination Tool to Vercel

This is the web version of the GEO-SEO Domination Tool, optimized for Vercel deployment.

## Prerequisites

- Vercel account (free tier works)
- GitHub repository (optional but recommended)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to the web-app directory:
   ```bash
   cd web-app
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts and set up your project

### Option 2: Deploy via Vercel Dashboard

1. Push this `web-app` directory to a GitHub repository

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "New Project"

4. Import your GitHub repository

5. Set the **Root Directory** to `web-app`

6. Vercel will auto-detect the Vite framework

7. Click "Deploy"

## Environment Variables

Add these in the Vercel Dashboard under Project Settings > Environment Variables:

```
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key
VITE_SEMRUSH_API_KEY=your_semrush_api_key
```

## Differences from Desktop Version

- **No Electron**: This is a pure web app
- **Serverless APIs**: Backend runs on Vercel Functions (in `/api` directory)
- **No local database**: Uses browser storage or connects to external database
- **Browser-based**: Runs entirely in the browser

## Project Structure

```
web-app/
├── api/              # Vercel serverless functions
├── src/              # React source code
├── public/           # Static assets
├── vercel.json       # Vercel configuration
└── package.json      # Dependencies (no Electron)
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build output will be in the `dist` directory.
