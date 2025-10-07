#!/bin/bash
# Setup script for SEO Toolkit MCP Server (macOS/Linux)

set -e

echo "========================================"
echo "SEO Toolkit MCP Server Setup"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.10 or higher"
    exit 1
fi

echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version)
echo "Found $PYTHON_VERSION"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo
    echo "Installing uv package manager..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo
echo "Creating virtual environment..."
uv venv

echo
echo "Activating virtual environment..."
source .venv/bin/activate

echo
echo "Installing dependencies..."
uv add "mcp[cli]" httpx psycopg2-binary python-dotenv

echo
echo "Checking for .env file..."
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo
    echo "WARNING: Please edit .env file and add your API keys!"
    echo
fi

echo
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Edit .env file and add your API keys:"
echo "   nano .env"
echo
echo "2. Add the server to Claude Desktop config:"
echo "   Location: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo
echo "Example config:"
echo '{'
echo '  "mcpServers": {'
echo '    "seo-toolkit": {'
echo '      "command": "uv",'
echo '      "args": ['
echo '        "--directory",'
echo "        \"$(pwd)\","
echo '        "run",'
echo '        "server.py"'
echo '      ]'
echo '    }'
echo '  }'
echo '}'
echo
echo "3. Restart Claude Desktop completely"
echo
