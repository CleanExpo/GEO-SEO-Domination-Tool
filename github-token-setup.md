# GitHub Token Setup Instructions

## Method 1: Direct Configuration (Current)
Replace `YOUR_GITHUB_TOKEN_HERE` in your MCP config with your actual token.

## Method 2: Environment Variable (Recommended for Security)

### Windows PowerShell:
```powershell
# Set environment variable for current session
$env:GITHUB_TOKEN = "your_actual_token_here"

# Set permanently for your user
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_actual_token_here", [System.EnvironmentVariableTarget]::User)
```

### Windows Command Prompt:
```cmd
# Set environment variable for current session
set GITHUB_TOKEN=your_actual_token_here

# Set permanently for your user
setx GITHUB_TOKEN "your_actual_token_here"
```

If using environment variables, update your MCP config to:
```json
"env": {
  "GITHUB_TOKEN": "${GITHUB_TOKEN}"
}
```

## Token Scopes Required:
- ✅ repo (Full control of private repositories)
- ✅ read:user (Read user profile data)
- ✅ user:email (Access user email addresses)  
- ✅ read:org (Read org and team membership)

## Testing the Connection:
Once configured, restart Claude/Cline and the GitHub MCP server should connect successfully.
