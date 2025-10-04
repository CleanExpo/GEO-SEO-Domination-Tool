# Remote Sync + Upload

Two strategies:

1. **Rsync (recommended)**
   - `POST /api/sync { action: 'dry_run' }` → preview changes
   - `POST /api/sync { action: 'sync_rsync' }` → push files
   - Respects **.deployignore** patterns
   - Requires `rsync` on your machine

2. **Bundle + SCP (portable)**
   - `POST /api/sync { action: 'make_bundle' }` → makes `.zip` (Windows) or `.tar.gz` (Unix)
   - `POST /api/sync { action: 'upload_bundle', bundle: '<local path>' }` → uploads to server
   - `POST /api/sync { action: 'unpack_bundle', remoteBundle: '<filename>' }` → unpacks on server
   - Or single step: `POST /api/sync { action: 'sync_all', remotePath, composePath }`

Configure remote path:
- `POST /api/sync { action: 'save_remote_path', remotePath: '/srv/app' }`

UI: **Projects → Builds → Remote Sync + SSH Compose**
- Dry-run & full rsync
- Make bundle, then **Sync All** (bundle→scp→unpack→up)

Notes:
- SSH host/user/port/key are defined via `/api/deploy` (save_ssh) and reused here.
- `.deployignore` controls what gets excluded.
- Ensure the remote has Docker + Compose installed and your compose path is correct.
