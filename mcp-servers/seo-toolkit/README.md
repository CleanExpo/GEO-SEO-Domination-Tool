# SEO Toolkit MCP Server

A comprehensive Model Context Protocol (MCP) server for SEO analysis and optimization. Integrates with the GEO-SEO Domination Tool database and external APIs to provide AI-powered SEO tools through Claude Desktop and other MCP clients.

## Features

### Technical SEO Audit
- **run_lighthouse_audit** - Run comprehensive Lighthouse audits using Google PageSpeed Insights
- **analyze_technical_seo** - Perform detailed technical SEO analysis with Firecrawl scraping

### Keyword Research & Tracking
- **get_keyword_data** - Get comprehensive keyword metrics from SEMrush (volume, CPC, competition)
- **find_keyword_opportunities** - Discover keyword opportunities for any domain
- **get_keyword_rankings** - View tracked keyword rankings from database

### Competitor Analysis
- **analyze_competitors** - Identify and analyze top organic competitors
- **get_backlink_profile** - Analyze backlink profiles with anchor text distribution

### Local SEO
- **analyze_local_seo** - Comprehensive local SEO analysis with scoring
- **find_citation_sources** - Get industry-specific citation source recommendations

### Content Optimization
- **analyze_content_for_ai** - Analyze content for AI search optimization (Claude, ChatGPT, Google AI)
- **generate_content_outline** - Generate AI-optimized content outlines

### Database Operations
- **get_company_overview** - Retrieve complete company profile with SEO metrics
- **get_keyword_rankings** - View all tracked keywords for a company

## Installation

### Prerequisites

- Python 3.10 or higher
- Access to the GEO-SEO Domination Tool database (SQLite or PostgreSQL)
- API keys for external services (see Configuration)

### Setup on Windows

```powershell
# Navigate to the MCP server directory
cd D:\GEO_SEO_Domination-Tool\mcp-servers\seo-toolkit

# Install uv (Python package manager)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Create virtual environment
uv venv

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
uv add "mcp[cli]" httpx psycopg2-binary python-dotenv
```

### Setup on macOS/Linux

```bash
# Navigate to the MCP server directory
cd /path/to/GEO_SEO_Domination-Tool/mcp-servers/seo-toolkit

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
uv add "mcp[cli]" httpx psycopg2-binary python-dotenv
```

## Configuration

### Environment Variables

The MCP server reads configuration from the project's `.env.local` file. Ensure the following variables are set:

```bash
# Required API Keys
GOOGLE_API_KEY=your_google_api_key_here
SEMRUSH_API_KEY=your_semrush_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Database Configuration
# For SQLite (local development)
SQLITE_PATH=./data/geo-seo.db

# For PostgreSQL (production)
DATABASE_URL=postgresql://user:password@host:port/database
# OR
POSTGRES_URL=postgresql://user:password@host:port/database
```

### API Key Setup

1. **Google PageSpeed Insights API**
   - Get a free API key at: https://developers.google.com/speed/docs/insights/v5/get-started
   - Used for Lighthouse audits

2. **SEMrush API**
   - Sign up at: https://www.semrush.com/api-analytics/
   - Used for keyword research, competitor analysis, and backlink data

3. **Anthropic Claude API**
   - Get API key at: https://console.anthropic.com/
   - Used for AI content analysis and generation

4. **Firecrawl API**
   - Sign up at: https://firecrawl.dev/
   - Used for advanced web scraping and content extraction

## Claude Desktop Integration

### Configuration

Add the following to your Claude Desktop configuration file:

**Windows:** `%AppData%\Claude\claude_desktop_config.json`

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seo-toolkit": {
      "command": "uv",
      "args": [
        "--directory",
        "D:\\GEO_SEO_Domination-Tool\\mcp-servers\\seo-toolkit",
        "run",
        "server.py"
      ],
      "env": {
        "GOOGLE_API_KEY": "your_google_api_key",
        "SEMRUSH_API_KEY": "your_semrush_api_key",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key",
        "FIRECRAWL_API_KEY": "your_firecrawl_api_key",
        "SQLITE_PATH": "D:\\GEO_SEO_Domination-Tool\\data\\geo-seo.db"
      }
    }
  }
}
```

**Note:** Replace `D:\\GEO_SEO_Domination-Tool` with your actual project path. On macOS/Linux, use forward slashes: `/path/to/GEO_SEO_Domination-Tool`

### Restart Claude Desktop

After updating the configuration:
1. Completely quit Claude Desktop (not just close the window)
2. Restart Claude Desktop
3. Look for the "Search and tools" icon to verify the server is loaded

## Usage Examples

### Technical SEO Audit

```
You: "Run a Lighthouse audit for https://example.com on mobile"

Claude will use the run_lighthouse_audit tool to analyze:
- Performance score
- Accessibility score
- Best practices score
- SEO score
- Core Web Vitals metrics
- Opportunities for improvement
```

### Keyword Research

```
You: "What's the search volume for 'local seo services'?"

Claude will use the get_keyword_data tool to show:
- Monthly search volume
- Cost per click (CPC)
- Competition level
- Number of search results
- Trend data
- Recommendation for targeting
```

### Competitor Analysis

```
You: "Find the top competitors for example.com"

Claude will use the analyze_competitors tool to discover:
- Top 10 organic competitors
- Common keywords
- Organic traffic estimates
- Keyword overlap analysis
```

### Local SEO Analysis

```
You: "Analyze local SEO for ABC Plumbing in San Francisco"

Claude will use the analyze_local_seo tool to evaluate:
- Local SEO score
- Google Business Profile status
- Citation count
- Keyword tracking
- Recommendations for improvement
```

### Content Optimization

```
You: "Create a content outline for 'commercial HVAC maintenance' in the HVAC industry"

Claude will use the generate_content_outline tool to create:
- SEO-optimized title
- H2/H3 heading structure
- Key facts and statistics to include
- FAQ section
- Internal linking opportunities
```

### Database Queries

```
You: "Show me the keyword rankings for ABC Plumbing"

Claude will use the get_keyword_rankings tool to display:
- All tracked keywords
- Current rankings
- Search volumes
- Competition levels
- Last checked dates
```

## Available Tools Reference

| Tool Name | Description | Required API |
|-----------|-------------|--------------|
| `run_lighthouse_audit` | Run Lighthouse performance audit | Google API |
| `analyze_technical_seo` | Technical SEO analysis with scraping | Firecrawl API |
| `get_keyword_data` | Get keyword metrics (volume, CPC, etc.) | SEMrush API |
| `find_keyword_opportunities` | Find keyword opportunities for domain | SEMrush API |
| `analyze_competitors` | Identify top organic competitors | SEMrush API |
| `get_backlink_profile` | Analyze backlink profile | SEMrush API |
| `analyze_local_seo` | Local SEO analysis with scoring | Database only |
| `find_citation_sources` | Get citation source recommendations | Database only |
| `analyze_content_for_ai` | AI search optimization analysis | Anthropic + Firecrawl |
| `generate_content_outline` | Generate AI-optimized content outline | Anthropic API |
| `get_company_overview` | Get complete company profile | Database only |
| `get_keyword_rankings` | View tracked keyword rankings | Database only |

## Troubleshooting

### Server Not Showing Up in Claude Desktop

1. Check the configuration file syntax (JSON must be valid)
2. Verify the absolute path to the server directory
3. Ensure Python 3.10+ is installed: `python --version`
4. Check Claude Desktop logs:
   - **Windows:** `%AppData%\Claude\logs\`
   - **macOS:** `~/Library/Logs/Claude/`

### API Key Errors

If you see "API key not configured" errors:

1. Verify API keys are set in the `env` section of `claude_desktop_config.json`
2. Alternatively, create a `.env` file in the MCP server directory:

```bash
# .env file in mcp-servers/seo-toolkit/
GOOGLE_API_KEY=your_key_here
SEMRUSH_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
FIRECRAWL_API_KEY=your_key_here
SQLITE_PATH=../../data/geo-seo.db
```

3. Restart Claude Desktop completely

### Database Connection Issues

**SQLite:**
- Ensure the database file exists: `./data/geo-seo.db`
- Run database initialization: `npm run db:init`

**PostgreSQL:**
- Verify `DATABASE_URL` or `POSTGRES_URL` is set correctly
- Test connection: `npm run db:test`
- Check network access to database server

### Tool Execution Failures

Check the Claude Desktop logs for detailed error messages:

```bash
# macOS/Linux
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows (PowerShell)
Get-Content "$env:APPDATA\Claude\logs\mcp-seo-toolkit.log" -Wait -Tail 50
```

Common issues:
- API rate limits (wait and retry)
- Invalid URLs (ensure full URL with https://)
- Database query errors (check company/keyword exists)

## Development

### Testing the Server Locally

```bash
# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# Run the server
uv run server.py

# The server will start and wait for MCP protocol messages on stdin
```

### Adding New Tools

1. Add a new function decorated with `@mcp.tool()`:

```python
@mcp.tool()
async def my_new_tool(param1: str, param2: int = 10) -> str:
    """
    Description of what the tool does.

    Args:
        param1: Description of param1
        param2: Description of param2 (default: 10)

    Returns:
        Description of return value
    """
    # Implementation here
    return "Result"
```

2. Restart Claude Desktop to load the new tool

### Database Schema

The MCP server works with the following main tables:

- `companies` - Business information
- `audits` - SEO audit results
- `keywords` - Tracked keywords and rankings
- `competitors` - Competitor data
- `citations` - Local citation sources

See `database/schema.sql` for complete schema.

## Architecture

### Database Auto-Detection

The server automatically detects and uses the appropriate database:

- **Development:** SQLite at `./data/geo-seo.db`
- **Production:** PostgreSQL via `DATABASE_URL` or `POSTGRES_URL`

Queries are automatically adjusted for the database type.

### API Integration

The server integrates with:

- **Google PageSpeed Insights** - Lighthouse audits
- **SEMrush** - Keyword research, competitor analysis, backlinks
- **Anthropic Claude** - Content analysis and generation
- **Firecrawl** - Web scraping and content extraction

### Error Handling

All tools include comprehensive error handling:
- API request failures return user-friendly error messages
- Database errors are logged and don't crash the server
- Missing API keys return informative messages about which key is needed

## Performance Considerations

### Rate Limiting

Be aware of API rate limits:
- **Google PageSpeed Insights:** 25,000 requests/day (free tier)
- **SEMrush:** Varies by plan (typically 10-40 API units/day)
- **Anthropic Claude:** Based on usage tier
- **Firecrawl:** Based on plan

### Caching

Consider implementing caching for frequently accessed data:
- Cache Lighthouse results for 24 hours
- Cache SEMrush keyword data for 7 days
- Cache competitor analysis for 30 days

### Concurrent Requests

The server uses `httpx.AsyncClient` for concurrent API requests, improving performance for batch operations.

## Security

### API Key Protection

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys periodically
- Use separate keys for development and production

### Database Access

- Use read-only database credentials when possible
- Implement proper SQL injection protection (parameterized queries)
- Limit database access to necessary tables only

## License

This MCP server is part of the GEO-SEO Domination Tool project.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Claude Desktop logs for error messages
3. Verify API keys and database configuration
4. Check the main project documentation

## Changelog

### Version 1.0.0 (2025-01-08)

- Initial release with 12 SEO tools
- Support for both SQLite and PostgreSQL databases
- Integration with Google, SEMrush, Anthropic, and Firecrawl APIs
- Comprehensive error handling and logging
- Full Claude Desktop integration

## Roadmap

Future enhancements planned:
- [ ] Add caching layer for API responses
- [ ] Implement batch operations for multiple URLs
- [ ] Add schema.org markup validation
- [ ] Integrate with Google Search Console API
- [ ] Add rank tracking automation
- [ ] Implement competitive gap analysis
- [ ] Add local pack position tracking
- [ ] Create SEO reporting tools
