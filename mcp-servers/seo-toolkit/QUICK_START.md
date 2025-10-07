# SEO Toolkit MCP Server - Quick Start Guide

Get started with the SEO Toolkit MCP Server in 5 minutes!

## Prerequisites

- Python 3.10 or higher
- Claude Desktop installed
- API keys (at least one of: Google, SEMrush, Anthropic, or Firecrawl)

## Installation (3 Steps)

### Step 1: Run Setup Script

**Windows:**
```powershell
cd D:\GEO_SEO_Domination-Tool\mcp-servers\seo-toolkit
.\setup.bat
```

**macOS/Linux:**
```bash
cd /path/to/GEO_SEO_Domination-Tool/mcp-servers/seo-toolkit
chmod +x setup.sh
./setup.sh
```

### Step 2: Configure API Keys

Edit the `.env` file and add your API keys:

```bash
GOOGLE_API_KEY=your_actual_google_key
SEMRUSH_API_KEY=your_actual_semrush_key
ANTHROPIC_API_KEY=your_actual_anthropic_key
FIRECRAWL_API_KEY=your_actual_firecrawl_key
```

**Get API Keys:**
- Google: https://developers.google.com/speed/docs/insights/v5/get-started (Free)
- SEMrush: https://www.semrush.com/api-analytics/ (Paid plans)
- Anthropic: https://console.anthropic.com/ (Usage-based)
- Firecrawl: https://firecrawl.dev/ (Free tier available)

### Step 3: Add to Claude Desktop

**Windows:** Edit `%AppData%\Claude\claude_desktop_config.json`

**macOS:** Edit `~/Library/Application Support/Claude/claude_desktop_config.json`

Copy the configuration from `claude_desktop_config.example.json` and update the path:

```json
{
  "mcpServers": {
    "seo-toolkit": {
      "command": "uv",
      "args": [
        "--directory",
        "YOUR_PATH_HERE/mcp-servers/seo-toolkit",
        "run",
        "server.py"
      ]
    }
  }
}
```

**Important:** Replace `YOUR_PATH_HERE` with your actual project path!

## Verify Installation

1. **Test the server:**
   ```bash
   # Activate virtual environment
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # macOS/Linux

   # Run test suite
   python test_server.py
   ```

2. **Restart Claude Desktop** (completely quit and restart)

3. **Check for tools:** Look for the "Search and tools" icon in Claude Desktop

## Quick Test

Once Claude Desktop is restarted, try these commands:

```
You: "Run a Lighthouse audit for https://example.com"
Claude: [Uses run_lighthouse_audit tool]

You: "What's the search volume for 'seo services'?"
Claude: [Uses get_keyword_data tool]

You: "Find competitors for example.com"
Claude: [Uses analyze_competitors tool]
```

## Available Tools (12 Total)

| Category | Tools |
|----------|-------|
| **Technical SEO** | run_lighthouse_audit, analyze_technical_seo |
| **Keywords** | get_keyword_data, find_keyword_opportunities, get_keyword_rankings |
| **Competitors** | analyze_competitors, get_backlink_profile |
| **Local SEO** | analyze_local_seo, find_citation_sources |
| **Content** | analyze_content_for_ai, generate_content_outline |
| **Database** | get_company_overview, get_keyword_rankings |

## Troubleshooting

### Server Not Showing Up
- Check JSON syntax in `claude_desktop_config.json`
- Verify absolute path is correct
- Check logs: `%AppData%\Claude\logs\` (Windows) or `~/Library/Logs/Claude/` (macOS)
- Restart Claude Desktop completely (quit from system tray/menu bar)

### API Errors
- Verify API keys in `.env` are correct
- Check API key quotas/limits
- Some tools require specific API keys (check README)

### Database Errors
- Run `npm run db:init` from project root to create SQLite database
- Or configure PostgreSQL with `DATABASE_URL` environment variable

## Common Use Cases

### SEO Audit Workflow
```
1. "Run a Lighthouse audit for [URL]"
2. "Analyze technical SEO for [URL]"
3. "What keyword opportunities exist for [domain]?"
4. "Who are the main competitors for [domain]?"
```

### Local SEO Workflow
```
1. "Analyze local SEO for [Business Name] in [City]"
2. "Find citation sources for [industry] in [location]"
3. "Show keyword rankings for [Business Name]"
```

### Content Strategy Workflow
```
1. "Create a content outline for [topic] in [industry]"
2. "Analyze [URL] for AI search optimization"
3. "What are the top keywords for [domain]?"
```

## Next Steps

1. **Read the full README** for detailed documentation
2. **Configure all API keys** for full functionality
3. **Run test_server.py** to verify setup
4. **Explore all 12 tools** in Claude Desktop
5. **Check API usage** and set up rate limiting if needed

## Support

- Full documentation: See `README.md`
- Example config: See `claude_desktop_config.example.json`
- Test script: Run `python test_server.py`
- Logs: Check Claude Desktop logs for error messages

## Tips

- Start with free APIs (Google PageSpeed) to test the server
- Add one API key at a time and test functionality
- Use database tools even without external APIs
- Monitor API usage to avoid hitting rate limits
- Cache results for frequently accessed data

---

**Ready to go?** Restart Claude Desktop and start analyzing!
