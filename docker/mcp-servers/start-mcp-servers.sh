#!/bin/bash

# Start MCP Servers in Docker
# Usage: ./start-mcp-servers.sh [puppeteer|playwright|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  GEO-SEO MCP Servers - Docker Startup${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}\n"

# Parse arguments
SERVICE="${1:-all}"

case "$SERVICE" in
    puppeteer)
        echo -e "${YELLOW}Starting Puppeteer MCP server...${NC}"
        docker-compose up -d puppeteer-mcp
        ;;
    playwright)
        echo -e "${YELLOW}Starting Playwright MCP server...${NC}"
        docker-compose up -d playwright-mcp
        ;;
    all)
        echo -e "${YELLOW}Starting all MCP servers...${NC}"
        docker-compose up -d
        ;;
    *)
        echo -e "${RED}Unknown service: $SERVICE${NC}"
        echo "Usage: $0 [puppeteer|playwright|all]"
        exit 1
        ;;
esac

echo -e "\n${YELLOW}Waiting for containers to be healthy...${NC}"
sleep 5

# Check container status
echo -e "\n${CYAN}Container Status:${NC}\n"
docker-compose ps

# Check logs
echo -e "\n${CYAN}Recent Logs:${NC}\n"
docker-compose logs --tail=20

echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ MCP Servers Started${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${CYAN}Next Steps:${NC}"
echo "1. Update .claude/mcp.json to use mcp-docker.json configuration"
echo "2. Reload VS Code window"
echo "3. Test with: docker exec -i geo-seo-puppeteer-mcp node /app/mcp-wrapper.js"

echo -e "\n${CYAN}Management Commands:${NC}"
echo "• View logs:    docker-compose logs -f"
echo "• Stop servers: docker-compose down"
echo "• Restart:      docker-compose restart"
echo "• Status:       docker-compose ps"
