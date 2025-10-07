import json
import os

# Path to user config
config_path = r"C:\Users\Disaster Recovery 4\.claude.json"

# Read the config
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)

# Find the project-specific mcpServers section
project_key = r"D:\GEO_SEO_Domination-Tool"

if 'projects' in config and project_key in config['projects']:
    if 'mcpServers' not in config['projects'][project_key]:
        config['projects'][project_key]['mcpServers'] = {}

    # Add shadcn server
    config['projects'][project_key]['mcpServers']['shadcn'] = {
        "type": "stdio",
        "command": "cmd",
        "args": ["/c", "npx", "shadcn@latest", "mcp"],
        "env": {}
    }

    # Add shadcn-ui server
    config['projects'][project_key]['mcpServers']['shadcn-ui'] = {
        "type": "stdio",
        "command": "cmd",
        "args": [
            "/c",
            "npx",
            "@jpisnice/shadcn-ui-mcp-server",
            "--framework",
            "react",
            "--github-api-key",
            "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"
        ],
        "env": {}
    }

    # Write back
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

    print("Successfully added shadcn and shadcn-ui MCP servers!")
    print(f"Added to: {project_key}")
else:
    print(f"Project '{project_key}' not found in config")
    print(f"Available projects: {list(config.get('projects', {}).keys())[:5]}")
