# ⚠️ CRITICAL SECURITY WARNING: GMB OAuth Credentials

## 🔴 DANGER: Sensitive Credentials Added to .env.local

**Date**: January 11, 2025
**Action**: Google My Business OAuth credentials added to local environment

### What Was Added

The following **HIGHLY SENSITIVE** credentials are now in `.env.local`:

```
GMB_ACCESS_TOKEN     - OAuth access token (expires hourly)
GMB_REFRESH_TOKEN    - Long-lived refresh token (NEVER EXPIRES until revoked)
GMB_CLIENT_ID        - OAuth app client ID
GMB_CLIENT_SECRET    - OAuth app secret
```

### 🚨 SECURITY CHECKLIST

Before ANY git commit, verify:

- [x] `.env.local` is in `.gitignore` (verified at line 3)
- [ ] Run `git status` and ensure `.env.local` is NOT listed
- [ ] Never run `git add .env.local` or `git add .`
- [ ] Never copy/paste these tokens in Slack, Discord, GitHub issues, or any public forum

### ✅ What's Safe

```bash
# Safe - .env.local is properly ignored
git status
# Should NOT show .env.local

# Safe - selective staging
git add specific-file.ts

# Safe - check what will be committed
git diff --cached
```

### ❌ What's DANGEROUS

```bash
# DANGER - stages ALL files including ignored ones if forced
git add -f .env.local

# DANGER - can accidentally stage .env.local if not careful
git add .

# DANGER - committing without checking staged files
git commit -m "update" (without checking git diff --cached first)
```

### 🔐 Token Security Details

#### Access Token (`GMB_ACCESS_TOKEN`)
- **Expires**: ~1 hour
- **Risk if leaked**: Temporary access to your GMB account
- **Mitigation**: Token expires quickly, but still revoke if leaked

#### Refresh Token (`GMB_REFRESH_TOKEN`) - **HIGHEST RISK**
- **Expires**: NEVER (until manually revoked)
- **Risk if leaked**: Permanent access to your GMB account until revoked
- **Mitigation**: If leaked, immediately revoke at https://myaccount.google.com/permissions

#### Client Secret (`GMB_CLIENT_SECRET`)
- **Risk if leaked**: Others can impersonate your OAuth app
- **Mitigation**: Regenerate secret in Google Cloud Console

### 🆘 If Credentials Are Leaked

**IMMEDIATE ACTION REQUIRED:**

1. **Revoke OAuth Tokens**:
   - Go to https://myaccount.google.com/permissions
   - Find "GEO-SEO Domination Tool" or your OAuth app name
   - Click "Remove Access"

2. **Regenerate Client Secret**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Click "Regenerate Secret"
   - Update `.env.local` and Vercel with new secret

3. **Re-authenticate**:
   - Get new refresh token via OAuth flow
   - Update `.env.local` with new `GMB_REFRESH_TOKEN`

4. **Check Git History**:
   ```bash
   # Search git history for leaked tokens
   git log -p -S "GMB_REFRESH_TOKEN"

   # If found, rewrite history (DANGEROUS - coordinate with team)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```

5. **Notify Team**:
   - If repository is shared, notify all collaborators
   - Everyone should pull latest and verify `.env.local` is not in their repo

### 📋 Pre-Commit Checklist

Before running `git commit`, ALWAYS:

```bash
# 1. Check what's staged
git status

# 2. Review changes line-by-line
git diff --cached

# 3. Verify no sensitive files
git diff --cached --name-only | grep -E '\.env|secret|token|key'

# 4. If above returns anything, investigate before committing
```

### 🛡️ Additional Security Measures

1. **Use Git Pre-Commit Hooks**:
   ```bash
   # Install pre-commit hook to block .env files
   cat > .git/hooks/pre-commit << 'EOF'
   #!/bin/sh
   if git diff --cached --name-only | grep -E '\.env'; then
     echo "ERROR: Attempting to commit .env file!"
     echo "This is blocked to prevent credential leaks."
     exit 1
   fi
   EOF
   chmod +x .git/hooks/pre-commit
   ```

2. **Enable GitHub Secret Scanning**:
   - Repository > Settings > Code security and analysis
   - Enable "Secret scanning"
   - Enable "Push protection"

3. **Use Environment-Specific Tokens**:
   - Development: Short-lived tokens, rotate frequently
   - Production: Store in Vercel environment variables only

### 📚 Related Documentation

- [GMB_OAUTH_SETUP.md](../GMB_OAUTH_SETUP.md) - Setup instructions
- [.gitignore](../.gitignore) - Verify .env.local is listed (line 3)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/best-practices)

### ✅ Verification

Run this command to verify security:

```bash
# Should return: ".env.local is in .gitignore ✓"
grep -q "^\.env\.local$" .gitignore && echo ".env.local is in .gitignore ✓" || echo "⚠️ WARNING: .env.local NOT in .gitignore!"

# Should return empty (no .env.local staged)
git diff --cached --name-only | grep -E '\.env'
```

---

**Last Updated**: January 11, 2025
**Severity**: 🔴 CRITICAL
**Action Required**: Review before every commit
