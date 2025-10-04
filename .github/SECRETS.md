# GitHub Actions Secrets Configuration

## Required Secrets

Add these secrets to your GitHub repository settings:
**Settings → Secrets and variables → Actions → New repository secret**

### Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL
```
- **Description:** Your Supabase project URL
- **Example:** `https://abcdefghijklmnop.supabase.co`
- **Where to find:** Supabase Dashboard → Project Settings → API → Project URL

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
- **Description:** Your Supabase anonymous/public key
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

### Vercel Deployment

```
VERCEL_TOKEN
```
- **Description:** Vercel authentication token for deployments
- **Where to find:** Vercel Dashboard → Settings → Tokens → Create Token
- **Scopes needed:** Full access to your account

```
VERCEL_ORG_ID
```
- **Description:** Your Vercel organization/team ID
- **Where to find:** Vercel Dashboard → Settings → General → Organization ID
- **Note:** If you're using a personal account, this is your user ID

```
VERCEL_PROJECT_ID
```
- **Description:** The specific project ID for this application
- **Where to find:** Vercel Dashboard → Project Settings → General → Project ID

## How to Add Secrets

### Method 1: GitHub UI
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name (exactly as shown above)
6. Paste the secret value
7. Click **Add secret**

### Method 2: GitHub CLI
```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL -b "https://your-project.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY -b "your-anon-key"
gh secret set VERCEL_TOKEN -b "your-vercel-token"
gh secret set VERCEL_ORG_ID -b "your-org-id"
gh secret set VERCEL_PROJECT_ID -b "your-project-id"
```

## CI/CD Pipeline Features

### On Pull Request:
- ✅ Lint check (ESLint)
- ✅ Type check (TypeScript)
- ✅ Build verification
- ✅ Run tests
- ✅ Security audit (npm audit)
- ✅ Deploy preview to Vercel
- ✅ Lighthouse performance audit

### On Push to Main:
- ✅ All PR checks
- ✅ Deploy to Vercel production
- ✅ Build artifact upload

## Workflow Jobs

### 1. lint-and-typecheck
- Runs ESLint to catch code quality issues
- Runs TypeScript compiler in check-only mode
- Fails if any lint errors or type errors exist

### 2. build
- Builds the Next.js application
- Uses Supabase environment variables
- Uploads `.next` build artifacts
- Depends on: lint-and-typecheck

### 3. test
- Runs all test suites
- Uses `--passWithNoTests` to avoid failing when no tests exist
- Depends on: lint-and-typecheck

### 4. security-audit
- Runs `npm audit` to check for vulnerable dependencies
- Runs `audit-ci` for stricter security checks
- Continues on error (won't fail the build)

### 5. deploy-preview
- Only runs on pull requests
- Deploys to Vercel preview environment
- Generates unique preview URL for testing
- Depends on: build, test

### 6. deploy-production
- Only runs on pushes to `main` branch
- Deploys to Vercel production
- Depends on: build, test, security-audit

### 7. lighthouse-audit
- Only runs on pull requests after preview deployment
- Runs Google Lighthouse performance audit
- Uploads performance reports as artifacts

## Triggering the Pipeline

### Automatic Triggers:
- Push to `main` or `develop` branches
- Pull request to `main` or `develop` branches

### Manual Trigger:
```bash
# Via GitHub UI: Actions → CI/CD Pipeline → Run workflow

# Via GitHub CLI:
gh workflow run ci.yml
```

## Verifying the Setup

After adding all secrets:

1. Create a test pull request
2. Check **Actions** tab for running workflows
3. Verify all jobs pass successfully
4. Check for Vercel preview deployment comment on PR
5. Review Lighthouse audit results

## Troubleshooting

### Build fails with "Missing environment variables"
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in GitHub Secrets

### Vercel deployment fails
- Verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are correct
- Check token has not expired
- Ensure Vercel project exists and is linked correctly

### TypeScript errors in CI but not locally
- Run `npx tsc --noEmit` locally to reproduce
- Check for different TypeScript versions between local and CI
- Ensure all type definitions are installed

### Lighthouse audit fails
- Preview deployment must be successful first
- Check preview URL is accessible
- Verify no authentication blocking the audit

## Security Best Practices

✅ **DO:**
- Rotate tokens regularly
- Use scoped tokens with minimum required permissions
- Keep secrets in GitHub Secrets (never commit to code)
- Review security audit results

❌ **DON'T:**
- Share tokens publicly or in code
- Use production database credentials in CI
- Ignore security audit warnings
- Commit `.env` files
