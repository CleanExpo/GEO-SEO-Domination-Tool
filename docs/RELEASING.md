# Releasing

## Quick path (one shot)
```powershell
pwsh scripts/release/tag-and-release.ps1 -Repo YOUR_ORG/YOUR_REPO -Version v1.0.0
```
- Generates notes via GitHub API (between previous tag → new tag)
- Creates annotated git tag + pushes
- Creates GitHub Release with generated notes

## Notes only (dry run)
```powershell
pwsh scripts/release/generate-notes.ps1 -Repo YOUR_ORG/YOUR_REPO -Version v1.0.0
```
Notes saved to **docs/RELEASE_NOTES.md**.

## Requirements
- `git` installed and repo is clean
- `GITHUB_TOKEN` env set **or** `geo secrets --set github_token=...`
- Remote named `origin` pointing to GitHub
