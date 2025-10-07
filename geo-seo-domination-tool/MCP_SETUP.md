# Shadcn UI MCP Server Setup

This project is configured to use the Shadcn UI MCP Server for AI-assisted component integration.

## What is the Shadcn UI MCP Server?

The Shadcn UI MCP Server provides AI assistants with comprehensive access to shadcn/ui v4 components, blocks, demos, and metadata. It enables:

- 🎯 **Multi-Framework Support** - React, Svelte, Vue, and React Native
- 📦 **Component Source Code** - Latest shadcn/ui v4 TypeScript source
- 🎨 **Component Demos** - Example implementations and usage patterns
- 🏗️ **Blocks Support** - Complete block implementations (dashboards, calendars, forms)
- 📋 **Metadata Access** - Dependencies, descriptions, and configuration details

## Quick Start

### 1. Get GitHub Token (Recommended)

For better rate limits (5000 requests/hour instead of 60):

1. Visit https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like "Shadcn MCP Server"
4. **No scopes needed** - just create the token
5. Copy the token (starts with `ghp_`)

### 2. Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

**Windows (Command Prompt):**
```cmd
set GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

**Linux/macOS:**
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

### 3. Restart Claude Code

After setting the environment variable, restart Claude Code to enable the MCP server.

### 4. Verify Connection

Run `/mcp` in Claude Code to see the MCP server status. You should see:
- ✅ shadcn-ui: Connected

## Configuration

The MCP server is configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "shadcn-ui": {
      "command": "npx",
      "args": [
        "@jpisnice/shadcn-ui-mcp-server",
        "--framework",
        "react"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Usage Examples

Once configured, you can ask Claude Code:

### Component Installation
- "Add a button component from shadcn/ui"
- "Install the dialog and card components"
- "Get the form component with all dependencies"

### Component Discovery
- "Show me all available shadcn/ui components"
- "Find me a login form component"
- "What components are available for forms?"

### Block Implementation
- "Get the dashboard-01 block"
- "Show me calendar blocks"
- "Install the authentication-01 block"

### Code Generation
- "Create a contact form using shadcn/ui components"
- "Build a dashboard with cards and charts"
- "Generate a login page with shadcn components"

## Framework Support

The server supports multiple frameworks. To switch:

**React (default):**
```json
"args": ["@jpisnice/shadcn-ui-mcp-server", "--framework", "react"]
```

**Svelte:**
```json
"args": ["@jpisnice/shadcn-ui-mcp-server", "--framework", "svelte"]
```

**Vue:**
```json
"args": ["@jpisnice/shadcn-ui-mcp-server", "--framework", "vue"]
```

**React Native:**
```json
"args": ["@jpisnice/shadcn-ui-mcp-server", "--framework", "react-native"]
```

## Troubleshooting

### MCP Server Not Responding

1. **Check Environment Variable**: Ensure `GITHUB_PERSONAL_ACCESS_TOKEN` is set
2. **Restart Claude Code**: Environment variables require restart
3. **Verify Token**: Make sure token starts with `ghp_`
4. **Check Logs**: Run `/mcp` to see connection status

### Rate Limit Issues

If you see rate limit errors:
- Without token: 60 requests/hour
- With token: 5000 requests/hour
- Solution: Add GitHub token (see step 1)

### No Components Found

1. **Check Framework**: Ensure framework matches your project (React by default)
2. **Verify Repository**: React uses `shadcn-ui/ui`, Svelte uses `shadcn-svelte`, etc.
3. **Network Access**: Ensure you can access GitHub

## Available Tools

The MCP server provides these tools:

1. **get_component_source** - Get component implementation
2. **get_component_demo** - Get component demo/example
3. **get_block_source** - Get block implementation
4. **get_component_metadata** - Get component metadata
5. **list_components** - List all available components
6. **list_blocks** - List all available blocks
7. **browse_directory** - Browse repository structure

## Resources

- [Shadcn UI MCP Server GitHub](https://github.com/Jpisnice/shadcn-ui-mcp-server)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [MCP Specification](https://modelcontextprotocol.io)
- [Claude Code MCP Docs](https://docs.anthropic.com/en/docs/claude-code/mcp)

## License

This MCP server is provided by [@Jpisnice/shadcn-ui-mcp-server](https://github.com/Jpisnice/shadcn-ui-mcp-server) under MIT License.
