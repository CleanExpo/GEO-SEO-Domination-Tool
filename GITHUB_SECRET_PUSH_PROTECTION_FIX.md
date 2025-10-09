# GitHub Secret Push Protection - Resolution Guide

**Date:** 2025-10-09
**Status:** ⚠️ **BLOCKING DEPLOYMENT** - Secret detected in commit history

## Issue

GitHub Push Protection is blocking push to `main` branch due to exposed Perplexity API key in commit `19e1800`.

### Error Details
```
remote: - Push cannot contain secrets
remote:    —— Perplexity API Key ————————————————————————————————
remote:     locations:
remote:       - commit: 19e1800646584ffb467c20ca78bb80931fa50ca6
remote:         path: .claude/mcp-docker.json:18
```

### Blocked URL
```
https://github.com/CleanExpo/GEO-SEO-Domination-Tool/security/secret-scanning/unblock-secret/33ow3Ke8P7XbjUBhD4MbJ662MNT
```

## Root Cause

Commit `19e1800` ("Security Breach Cleanup 01") contains hardcoded API keys in `.claude/mcp-docker.json`:

1. **Perplexity API Key**: `pplx-[REDACTED]`
2. **GitHub Token**: `ghp_[REDACTED]`
3. **Google API Key**: `AIza[REDACTED]`
4. **Supabase Anon Key**: `eyJh[REDACTED]` (JWT token)

## Resolution Options

### Option 1: Allow Secret via GitHub Web Interface (FASTEST)

**Recommended for immediate deployment**

1. Visit the unblock URL:
   ```
   https://github.com/CleanExpo/GEO-SEO-Domination-Tool/security/secret-scanning/unblock-secret/33ow3Ke8P7XbjUBhD4MbJ662MNT
   ```

2. Click **"Allow secret"** button

3. Push commits:
   ```bash
   git push origin main
   ```

4. **IMMEDIATELY after push**: Revoke and regenerate all exposed API keys

**⚠️ CRITICAL**: This option exposes your secrets publicly. You MUST rotate all keys immediately.

### Option 2: Rewrite Git History (SAFEST - Requires Force Push)

**Recommended for security compliance**

This removes the secrets from git history entirely but requires force-pushing.

#### Step 1: Install git-filter-repo
```bash
pip install git-filter-repo
```

#### Step 2: Create replacement file
```bash
cat > .claude/mcp-docker.json.new <<'EOF'
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server",
        "--project-url",
        "https://qwoggbbavikzhypzodcr.supabase.co",
        "--api-key",
        "${SUPABASE_ANON_KEY}"
      ]
    },
    "perplexity": {
      "command": "npx",
      "args": ["-y", "@perplexity/mcp-server"],
      "env": {
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "google-maps": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-maps"],
      "env": {
        "GOOGLE_API_KEY": "${GOOGLE_API_KEY}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "D:\\GEO_SEO_Domination-Tool"
      ]
    },
    "puppeteer-docker": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "geo-seo-puppeteer-mcp",
        "node",
        "/app/mcp-wrapper.js"
      ],
      "description": "Puppeteer MCP Server (Docker)"
    },
    "playwright-docker": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "geo-seo-playwright-mcp",
        "node",
        "/app/mcp-wrapper.js"
      ],
      "description": "Playwright MCP Server (Docker)"
    }
  }
}
EOF
```

#### Step 3: Rewrite history
```bash
# Create backup branch
git branch backup-before-filter main

# Filter the problematic file
git filter-repo --path .claude/mcp-docker.json --force --replace-text <(echo 'pplx-[REDACTED]==>${PERPLEXITY_API_KEY}')
```

#### Step 4: Force push
```bash
git push origin main --force
```

**⚠️ WARNING**: Force push rewrites history. Coordinate with team if others have pulled recent commits.

### Option 3: Squash Commits (INTERMEDIATE)

Reset to before the problematic commit and create a clean history:

```bash
# Reset to commit before 19e1800
git reset --soft ae5b1e0

# Create single clean commit
git add .
git commit -m "chore: Consolidate recent changes with secure configuration

- Add production issue analysis and fixes
- Update Serpbear integration
- Secure MCP Docker configuration with environment variables
- All API keys now use environment variable references

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Force push
git push origin main --force
```

## Security Remediation Checklist

### ✅ COMPLETED - All Keys Rotated (October 9, 2025)

After resolving the push issue, all exposed credentials were successfully rotated:

### 1. ✅ Perplexity API Key
```bash
# Status: Rotated earlier today (first)
# New key generated at: https://www.perplexity.ai/settings/api
```

### 2. ✅ GitHub Personal Access Token
```bash
# Status: Changed and confirmed
# New token generated at: https://github.com/settings/tokens
```

### 3. ✅ Google API Key
```bash
# Status: Changed earlier today
# New key generated at: https://console.cloud.google.com/apis/credentials
```

### 4. ℹ️ Supabase Anon Key
```bash
# Status: No rotation needed
# This is a public anon key (designed to be exposed in client-side code)
# Dashboard: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/settings/api
```

**Security Status**: ✅ **All exposed credentials have been invalidated and replaced**

## Prevention

### 1. Add .claude/mcp-docker.json to .gitignore
```bash
echo ".claude/mcp-docker.json" >> .gitignore
```

### 2. Create template file
```bash
cp .claude/mcp-docker.json .claude/mcp-docker.json.template
git add .claude/mcp-docker.json.template
```

### 3. Update documentation
Add to README.md:
```markdown
## Setup MCP Configuration

1. Copy template:
   ```bash
   cp .claude/mcp-docker.json.template .claude/mcp-docker.json
   ```

2. Set environment variables:
   ```bash
   export SUPABASE_ANON_KEY="your-key"
   export PERPLEXITY_API_KEY="your-key"
   export GITHUB_TOKEN="your-token"
   export GOOGLE_API_KEY="your-key"
   ```
```

### 4. Enable Secret Scanning
Visit: https://github.com/CleanExpo/GEO-SEO-Domination-Tool/settings/security_analysis

Enable:
- ✅ Secret scanning
- ✅ Push protection
- ✅ Dependency graph
- ✅ Dependabot alerts

## Railway Build Impact

The Railway build failure (npm ci error) is **independent** of this secret scanning issue. Both need to be resolved:

1. **This issue**: Secret push protection (blocks git push)
2. **Railway issue**: package-lock.json sync (blocks build)

**Recommended sequence**:
1. Fix this secret issue first (choose Option 1, 2, or 3)
2. Then address Railway build by regenerating package-lock.json
3. Deploy to production

## Related Files

- [.claude/mcp-docker.json](.claude/mcp-docker.json) - Current clean version
- [PRODUCTION_ISSUE_ANALYSIS.md](PRODUCTION_ISSUE_ANALYSIS.md) - Separate production 500 error
- [logs.1759996663285.json](logs.1759996663285.json) - Railway build failure logs

## Quick Decision Matrix

| Scenario | Recommended Option | Reason |
|----------|-------------------|--------|
| Need immediate deploy, will rotate keys | Option 1 | Fastest, allows push immediately |
| Security compliance required | Option 2 | Removes secrets from history |
| Small team, low coordination cost | Option 3 | Clean history, easier than Option 2 |
| Large team with many collaborators | Option 1 + rotate | Avoids force push coordination |

## Current Status

✅ Latest commit (`adbb51d`) has clean configuration with environment variables
❌ Historical commit (`19e1800`) contains exposed secrets
❌ Git push blocked by GitHub Push Protection
⏳ Awaiting user decision on resolution option

---

**Next Action**: Choose Option 1, 2, or 3 and execute the steps.

**Timeline Estimate**:
- Option 1: 5 minutes
- Option 2: 15-20 minutes
- Option 3: 10 minutes
