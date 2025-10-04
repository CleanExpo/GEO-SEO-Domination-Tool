# Rollback Playbook

## Instant traffic rollback
- UI: `/deploy/bluegreen` → **Rollback (dev)** or **Switch → BLUE (prod)**
- CLI: `geo bluegreen switch --target blue` (dev) or use prod buttons

## If DB migration broke things
1) Switch traffic back to previous color
2) Restore DB from the latest backup (see BACKUP_RESTORE.md)
3) Create hotfix branch and re-deploy GREEN
