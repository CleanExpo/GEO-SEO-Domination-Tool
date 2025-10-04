# Backup & Restore

Backups are stored under `server/backups/` with timestamped filenames.

## SQLite
**Backup:**
```powershell
pwsh scripts/backup/backup.ps1 -Target sqlite -SqlitePath database/app.db
```
**Restore:**
```powershell
pwsh scripts/backup/restore.ps1 -Target sqlite -SqlitePath database/app.db -BackupPath server/backups/sqlite/<file>.zip
```

## Postgres
Environment variables (from `.env.local` or system env):
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

**Backup:**
```powershell
pwsh scripts/backup/backup.ps1 -Target postgres
```
**Restore:**
```powershell
pwsh scripts/backup/restore.ps1 -Target postgres -BackupPath server/backups/postgres/<file>.sql.gz
```
