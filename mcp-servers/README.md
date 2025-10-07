# MCP Servers Directory

This directory contains Model Context Protocol (MCP) servers that extend the GEO-SEO Domination Tool with AI-powered capabilities.

## Available Servers

### SEO Toolkit (`seo-toolkit/`)

Comprehensive SEO analysis and optimization server with 12 tools:

**Technical SEO:**
- Lighthouse performance audits
- Technical SEO analysis with web scraping

**Keyword Research:**
- Keyword metrics (volume, CPC, competition)
- Keyword opportunity discovery
- Ranking tracking from database

**Competitor Analysis:**
- Organic competitor identification
- Backlink profile analysis

**Local SEO:**
- Local SEO scoring and analysis
- Citation source recommendations

**Content Optimization:**
- AI search optimization analysis
- AI-optimized content outline generation

**Database Operations:**
- Company overview retrieval
- Keyword ranking reports

**[Full Documentation →](seo-toolkit/README.md)**

**[Quick Start Guide →](seo-toolkit/QUICK_START.md)**

## What are MCP Servers?

MCP (Model Context Protocol) servers allow AI assistants like Claude to access external tools, resources, and data sources. They extend Claude's capabilities beyond text generation to include:

- API integrations (Google, SEMrush, etc.)
- Database queries
- Web scraping and analysis
- Custom business logic

## Integration with Claude Desktop

MCP servers integrate directly with Claude Desktop, allowing you to use natural language to:

```
You: "Run a Lighthouse audit for my website"
Claude: [Uses MCP server to fetch real audit data]

You: "What keywords should I target for local HVAC services?"
Claude: [Uses MCP server to query SEMrush API and database]

You: "Analyze my competitor's backlink profile"
Claude: [Uses MCP server to fetch and analyze backlink data]
```

## Architecture

```
┌─────────────────────┐
│  Claude Desktop     │
│  (MCP Client)       │
└──────────┬──────────┘
           │ MCP Protocol (JSON-RPC over stdio)
           │
┌──────────▼──────────┐
│  MCP Server         │
│  (Python/FastMCP)   │
├─────────────────────┤
│  • Tools (12)       │
│  • Resources        │
│  • Prompts          │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌───▼────┐
│External│   │Database│
│  APIs  │   │        │
└────────┘   └────────┘
```

## Getting Started

1. **Install a server:**
   ```bash
   cd mcp-servers/seo-toolkit
   ./setup.bat  # Windows
   ./setup.sh   # macOS/Linux
   ```

2. **Configure API keys** in `.env` file

3. **Add to Claude Desktop** configuration

4. **Restart Claude Desktop**

5. **Start using tools** via natural language!

## Development

### Creating a New MCP Server

1. **Create directory:**
   ```bash
   mkdir mcp-servers/my-server
   cd mcp-servers/my-server
   ```

2. **Set up Python environment:**
   ```bash
   uv venv
   source .venv/bin/activate  # macOS/Linux
   .venv\Scripts\activate     # Windows
   uv add "mcp[cli]" httpx
   ```

3. **Create server.py:**
   ```python
   from mcp.server.fastmcp import FastMCP

   mcp = FastMCP("my-server")

   @mcp.tool()
   async def my_tool(param: str) -> str:
       """Tool description."""
       return f"Result: {param}"

   if __name__ == "__main__":
       mcp.run(transport='stdio')
   ```

4. **Test locally:**
   ```bash
   uv run server.py
   ```

5. **Add to Claude Desktop config**

### Best Practices

- **Never use `print()` in stdio mode** - Use logging to stderr
- **Provide clear docstrings** for all tools (Claude reads these)
- **Handle errors gracefully** - Return user-friendly error messages
- **Use async/await** for I/O operations
- **Validate inputs** before making external API calls
- **Cache results** when appropriate to save API calls

## Resources

- **MCP Documentation:** https://modelcontextprotocol.io/
- **FastMCP Guide:** See `docs/build-assistant-tools/mcp-server-guide.md`
- **Example Servers:** https://github.com/modelcontextprotocol/quickstart-resources
- **Claude Desktop:** https://claude.ai/download

## Troubleshooting

### Server not showing up in Claude Desktop

1. Check `claude_desktop_config.json` syntax (must be valid JSON)
2. Verify absolute paths (not relative)
3. Check Claude Desktop logs in:
   - Windows: `%AppData%\Claude\logs\`
   - macOS: `~/Library/Logs/Claude/`
4. Restart Claude Desktop completely (quit from system tray/menu bar)

### Tools not executing

1. Check server logs for errors
2. Verify API keys are configured
3. Test API connectivity separately
4. Check rate limits on external APIs

### Database connection errors

1. Verify database path or connection string
2. Run `npm run db:init` to create SQLite database
3. Check database permissions
4. Test connection with `npm run db:test`

## Future Servers (Planned)

- **Rank Tracking Server** - Automated rank checking and monitoring
- **Google Search Console Server** - GSC data integration
- **Schema.org Server** - Structured data validation and generation
- **Content Analysis Server** - Advanced content quality scoring
- **Link Building Server** - Backlink opportunity discovery
- **Reporting Server** - Automated SEO report generation

## Contributing

To add a new MCP server:

1. Create directory in `mcp-servers/`
2. Follow the structure of `seo-toolkit/` as a template
3. Include README.md, setup scripts, and tests
4. Update this main README with server description
5. Test with Claude Desktop before committing

## License

Part of the GEO-SEO Domination Tool project.
