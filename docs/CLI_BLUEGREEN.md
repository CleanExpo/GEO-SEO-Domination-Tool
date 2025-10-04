# geo CLI — Blue/Green

Drive Blue/Green deployments from the terminal (wraps `/api/bluegreen`).

```bash
geo bluegreen status
geo bluegreen build --target blue
geo bluegreen up --target green
geo bluegreen switch --target green
geo bluegreen rollback
geo bluegreen logs --target blue --tail 200
```
Use `--base-url http://your-host:3000` when remote.
