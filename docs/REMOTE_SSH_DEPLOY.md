# Remote SSH Deploy (MVP)

**API** `/api/deploy` actions:
- `save_ssh` { host, user, port?, keyPath?, extraSshArgs?, composePath? }
- `status_ssh`
- `config|build|up|down|ps|logs` with `{ target: 'ssh', composePath?, service?, tail? }`

Config is stored in `server/secrets/deploy.local.json` (gitignored). The server runs:
```
ssh -p <port> [-i <keyPath>] <user>@<host> "docker compose -f \"<composePath>\" <verb>"
```
Ensure your remote has Docker + Compose and the compose file path is correct.
