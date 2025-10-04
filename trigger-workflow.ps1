$repo = "YOUR_ORG/YOUR_REPO"
$branches = @'
feature/build-system-fix
feature/mcp-call-runner-fix
feature/mcp-server-core
feature/selective-apply-from-diff
feature/rollback-from-backups
feature/blueprint-saas-starter
feature/autolink-after-apply
feature/redis-workers-scale
feature/supabase-auth-starter
feature/role-guards-admin-ui
feature/api-role-guards
feature/oauth-providers
feature/stripe-billing-starter
feature/post-blueprint-autolink-deploy
feature/deploy-runner
feature/remote-ssh-deploy
feature/release-guardrails
feature/merge-queue
'@

gh workflow run "Auto Merge Release (Staged)" -R $repo `
  -f release_branch="release/geo-mcp-v1" `
  -f target_branch="main" `
  -f branches="$branches"
