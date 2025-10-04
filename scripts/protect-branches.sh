#!/usr/bin/env bash
# Usage:
#   export GITHUB_TOKEN=ghp_...
#   ./scripts/protect-branches.sh your-org your-repo
set -euo pipefail
OWNER=${1:?owner required}
REPO=${2:?repo required}
if [[ -z "${GITHUB_TOKEN:-}" ]]; then echo 'GITHUB_TOKEN env var required'; exit 1; fi
hdrs=( -H "Authorization: token $GITHUB_TOKEN" -H 'Accept: application/vnd.github+json' )
body(){
  cat <<JSON
{
  "required_status_checks": {"strict": true, "contexts": ["build"]},
  "enforce_admins": true,
  "required_pull_request_reviews": {"required_approving_review_count": 1, "require_code_owner_reviews": false, "dismiss_stale_reviews": true},
  "restrictions": null,
  "allow_deletions": false,
  "allow_force_pushes": false,
  "block_creations": false,
  "required_linear_history": true,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON
}
protect(){
  local branch="$1"
  curl -sSf -X PUT "https://api.github.com/repos/$OWNER/$REPO/branches/$branch/protection" "${hdrs[@]}" -d "$(body)" >/dev/null
  echo "✓ Protected $branch"
}
protect main
protect release/geo-mcp-v1
