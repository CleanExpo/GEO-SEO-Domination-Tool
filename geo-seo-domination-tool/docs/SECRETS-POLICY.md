# Secrets Management Policy

**TICKET:** VAULT-001
**Phase:** NOW (Week 1-2)
**Status:** Implemented
**Last Updated:** 2025-10-05

## Overview

The GEO-SEO Domination Tool implements **AES-256-GCM encrypted secrets management** to protect sensitive credentials (API keys, tokens, passwords) at rest and in transit.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Secrets Vault                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌───────────────┐                │
│  │ Master Key   │────▶│ PBKDF2 Derive │                │
│  │ (32 bytes)   │     │ + Random Salt │                │
│  └──────────────┘     └───────┬───────┘                │
│                               │                         │
│                        ┌──────▼────────┐                │
│                        │  AES-256-GCM  │                │
│                        │   Encryption  │                │
│                        └──────┬────────┘                │
│                               │                         │
│  ┌───────────────────────────▼────────────────┐        │
│  │  Encrypted Value (base64)                  │        │
│  │  = IV (16) + Ciphertext + AuthTag (16)     │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │  Database Storage (Supabase)            │           │
│  ├─────────────────────────────────────────┤           │
│  │ • encrypted_value (text)                │           │
│  │ • salt (text)                           │           │
│  │ • metadata (jsonb): scope, expiry, tags │           │
│  │ • version (int): rotation tracking      │           │
│  └─────────────────────────────────────────┘           │
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │  Audit Logs (All Access Tracked)       │           │
│  ├─────────────────────────────────────────┤           │
│  │ • created, read, updated, deleted       │           │
│  │ • user_id, ip_address, user_agent       │           │
│  │ • timestamp, action metadata            │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## Encryption Details

### Algorithm
- **Cipher:** AES-256-GCM (Galois/Counter Mode)
- **Key Derivation:** PBKDF2-HMAC-SHA256 (100,000 iterations)
- **IV:** 16 bytes (random per encryption)
- **Auth Tag:** 16 bytes (GCM authentication)
- **Salt:** 64 bytes (random per secret)

### Why AES-256-GCM?
- **Authenticated encryption:** Detects tampering
- **NIST approved:** FIPS 140-2 compliant
- **Fast:** Hardware-accelerated on modern CPUs
- **Secure:** No known practical attacks

### Master Key Management

**Production (Vercel):**
```bash
# Set in Vercel Dashboard → Environment Variables
SECRETS_MASTER_KEY=<64-char-hex-string>
```

**Generate Master Key:**
```bash
# Run once during initial setup
openssl rand -hex 32

# Output example:
# 3a7f2c9e8d1b6f4a5e3c8d9b2f1a6e4c7d8b9f2a3e5c6d7f8a9b1c2d3e4f5a6b
```

**Security Requirements:**
- ✅ Never commit to git
- ✅ Store in Vercel environment variables (encrypted at rest)
- ✅ Rotate annually or if compromised
- ✅ Use different keys for dev/staging/prod
- ✅ Backup key in 1Password/Vault (offline)

## Secret Scopes

Secrets are scoped to prevent unauthorised access:

| Scope | Description | Access Control |
|-------|-------------|----------------|
| **global** | Platform-wide secrets (e.g., Vercel API key) | Admin users only |
| **organisation** | Per-tenant secrets (e.g., client's Google OAuth) | Organisation members |
| **project** | Per-project secrets (e.g., repo deploy key) | Project collaborators |

**Scope Validation:**
```typescript
// Middleware enforces scope checks
const canAccess = vault.canAccess(
  secret,
  user.id,
  user.organisationId,
  user.projectId
);

if (!canAccess) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

## Rotation Policy

### Automatic Rotation Warnings

Secrets are flagged for rotation based on:
- **Expiry date:** Configured per secret
- **Rotation interval:** Configurable (e.g., 90 days)
- **Never rotated:** Secrets >90 days old

**Rotation Status Check:**
```typescript
const status = vault.needsRotation(secret);

if (status.needsRotation) {
  console.warn(`Secret ${secret.id} needs rotation:`, status.reason);
  // UI shows warning badge with days until expiry
}
```

### Rotation Workflow

1. **UI Warning:** Display badge if rotation needed
2. **User Action:** Click "Rotate" button in secrets dashboard
3. **New Value:** User provides updated API key/token
4. **Re-encrypt:** Vault encrypts with new salt
5. **Version Bump:** `version` incremented for audit trail
6. **Audit Log:** Record rotation action with timestamp

**Rollback:**
```sql
-- Revert to previous version (keep audit trail)
UPDATE secrets
SET encrypted_value = previous_encrypted_value,
    salt = previous_salt,
    version = version - 1,
    metadata = jsonb_set(metadata, '{lastRotatedAt}', previous_rotated_at)
WHERE id = 'secret-id';
```

## UI/UX Guidelines

### Display Secrets

**Masked by Default:**
```
sk-proj-abcd************************wxyz
```

**Copy-Masked:**
```typescript
// Clicking "Copy" reveals full value for 5 seconds
const handleCopy = async () => {
  const decrypted = await fetchSecret(secretId);
  await navigator.clipboard.writeText(decrypted);
  showToast('Copied to clipboard (cleared in 5s)');
  setTimeout(() => navigator.clipboard.writeText(''), 5000);
};
```

**Never Log:**
```typescript
// ❌ NEVER
console.log('API Key:', apiKey);

// ✅ ALWAYS
console.log('API Key: [REDACTED]');
```

### Secrets Dashboard UI

**Features:**
- 🔍 Search by name/tag
- 🏷️ Filter by scope (global/org/project)
- ⚠️ Rotation warnings with countdown
- 📊 Usage audit logs
- 🔒 Masked values with "Show/Hide" toggle
- 🔄 One-click rotation workflow

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  Secrets Vault                    [+ Add Secret]        │
├─────────────────────────────────────────────────────────┤
│  🔍 Search...   🏷️ Scope: All   ⚠️ Show expiring only  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ GitHub OAuth Token                    ⚠️ Expiring │   │
│  │ sk-gh-1234************************wxyz          │   │
│  │ Scope: Organisation • Expires in 7 days         │   │
│  │ [👁️ Show] [📋 Copy] [🔄 Rotate] [🗑️ Delete]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Vercel API Token                             │   │
│  │ vercel************************abc123          │   │
│  │ Scope: Global • Last rotated 45 days ago      │   │
│  │ [👁️ Show] [📋 Copy] [🔄 Rotate] [🗑️ Delete]     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Audit Logging

**All Secret Access is Logged:**

```sql
CREATE TABLE secret_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_id uuid REFERENCES secrets(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'created' | 'read' | 'updated' | 'rotated' | 'deleted'
  user_id uuid REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_secret ON secret_audit_logs(secret_id);
CREATE INDEX idx_audit_user ON secret_audit_logs(user_id);
CREATE INDEX idx_audit_created ON secret_audit_logs(created_at DESC);
```

**Retention Policy:**
- Keep audit logs for **2 years**
- Archive to cold storage after **6 months**
- Compliance: SOC 2 Type II, GDPR Article 32

## Database Schema

```sql
CREATE TABLE secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encrypted_value text NOT NULL, -- base64: iv + ciphertext + authTag
  salt text NOT NULL, -- base64
  metadata jsonb NOT NULL, -- SecretMetadata
  version int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_secrets_scope ON secrets((metadata->>'scope'));
CREATE INDEX idx_secrets_scope_id ON secrets((metadata->>'scopeId'));
CREATE INDEX idx_secrets_name ON secrets((metadata->>'name'));

-- Row-Level Security (RLS)
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY secrets_global_read ON secrets
  FOR SELECT
  USING (
    (metadata->>'scope' = 'global' AND auth.jwt()->>'role' = 'admin')
    OR
    (metadata->>'scope' = 'organisation' AND metadata->>'scopeId' = auth.jwt()->>'organisationId')
    OR
    (metadata->>'scope' = 'project' AND metadata->>'scopeId' = auth.jwt()->>'projectId')
  );

CREATE POLICY secrets_create ON secrets
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

## API Endpoints

### List Secrets
```bash
GET /api/secrets?scope=organisation&scopeId=org-123

Response:
{
  "success": true,
  "data": {
    "secrets": [
      {
        "id": "uuid",
        "name": "GitHub Token",
        "scope": "organisation",
        "rotationStatus": {
          "needsRotation": true,
          "reason": "expired",
          "daysUntilExpiry": 0
        },
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "count": 1
  }
}
```

### Create Secret
```bash
POST /api/secrets

Body:
{
  "value": "ghp_abc123...",
  "metadata": {
    "name": "GitHub OAuth Token",
    "description": "For repo sync",
    "scope": "organisation",
    "scopeId": "org-123",
    "expiresAt": "2026-01-01T00:00:00Z",
    "rotationIntervalDays": 90,
    "tags": ["github", "oauth"]
  }
}
```

### Get Secret (Decrypted)
```bash
GET /api/secrets/[id]

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "value": "ghp_abc123...", // Decrypted
    "metadata": {...},
    "maskedValue": "ghp_abc1************************xyz"
  }
}
```

### Rotate Secret
```bash
POST /api/secrets/[id]/rotate

Body:
{
  "newValue": "ghp_xyz789..."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "version": 2,
    "rotatedAt": "2025-10-05T12:00:00Z"
  }
}
```

## Security Checklist

- [x] **Encryption at Rest:** AES-256-GCM with per-secret salts
- [x] **Key Derivation:** PBKDF2 (100k iterations)
- [x] **Master Key:** Stored in Vercel env vars (not in code)
- [x] **Audit Logging:** All access tracked with user/IP/timestamp
- [x] **Scope Enforcement:** RLS policies prevent cross-tenant access
- [x] **Masking:** Secrets never displayed in full by default
- [x] **Rotation Warnings:** Automated expiry detection
- [x] **No Plaintext:** Never log or store unencrypted secrets

## Compliance

- **SOC 2 Type II:** Audit logs, encryption at rest, access controls
- **GDPR Article 32:** Appropriate technical measures for data security
- **PCI DSS 3.2.1:** If storing payment credentials (Requirement 3)
- **HIPAA:** If storing PHI (Technical Safeguards § 164.312)

## Rollback Procedure

**If secrets vault causes issues:**

1. **Disable Feature Flag:**
   ```typescript
   // In feature-flags.ts
   export const SECRETS_VAULT_ENABLED = false;
   ```

2. **Revert to Legacy:**
   ```typescript
   // Fallback to integrations.local.json
   const secrets = fs.readFileSync('server/secrets/integrations.local.json');
   ```

3. **Restore Environment Variables:**
   ```bash
   # Set secrets back to Vercel env vars
   vercel env add GITHUB_TOKEN production
   ```

**Rollback Time:** <5 minutes (tested)

## Support

**Questions?**
- Slack: #engineering-security
- Email: security@geo-seo.au
- Wiki: https://wiki.geo-seo.au/secrets

**Report Security Issues:**
- DO NOT create public GitHub issues
- Email: security@geo-seo.au (PGP: ABC123)
- Response SLA: 24 hours
