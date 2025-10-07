# SEO Toolkit MCP Server - Integration Guide

Complete guide for integrating the SEO Toolkit MCP Server with Claude Desktop and the GEO-SEO Domination Tool.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Tool Reference](#tool-reference)
6. [Usage Examples](#usage-examples)
7. [Integration Workflows](#integration-workflows)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Topics](#advanced-topics)

## Overview

The SEO Toolkit MCP Server provides 12 specialized tools for SEO analysis and optimization, accessible through natural language conversations with Claude Desktop.

### Key Benefits

- **Natural Language Interface** - Use conversational commands instead of complex API calls
- **Unified Access** - Single interface to Google, SEMrush, Anthropic, and Firecrawl APIs
- **Database Integration** - Direct access to GEO-SEO Domination Tool database
- **Real-time Analysis** - Get live SEO data without manual API interactions
- **AI-Powered Insights** - Combine Claude's analysis with specialized SEO tools

### System Requirements

- Python 3.10 or higher
- Claude Desktop (latest version)
- Windows, macOS, or Linux
- API keys for at least one service (Google recommended for start)

## Architecture

### Component Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      Claude Desktop                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Natural Language Interface                              │  │
│  │  - "Run audit for example.com"                          │  │
│  │  - "Find keyword opportunities"                         │  │
│  │  - "Analyze competitors"                                │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ MCP Protocol (JSON-RPC over stdio)
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                  SEO Toolkit MCP Server (Python)                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Tool Router & Handler                                      │  │
│  │  • Input validation                                        │  │
│  │  • Error handling                                          │  │
│  │  • Response formatting                                     │  │
│  └────────────┬──────────────┬──────────────┬─────────────────┘  │
│               │              │              │                     │
│  ┌────────────▼────┐  ┌──────▼──────┐  ┌───▼──────────┐        │
│  │ API Integrations│  │  Database   │  │   Utilities  │        │
│  │  • Google PSI   │  │  • SQLite   │  │  • SEO Score │        │
│  │  • SEMrush     │  │  • PostgreSQL│  │  • E-E-A-T   │        │
│  │  • Anthropic   │  │             │  │  • Parsing   │        │
│  │  • Firecrawl   │  │             │  │             │        │
│  └────────────┬────┘  └──────┬──────┘  └──────────────┘        │
└───────────────┼───────────────┼─────────────────────────────────┘
                │               │
        ┌───────▼────┐    ┌────▼──────┐
        │ External   │    │  Database │
        │   APIs     │    │   Files   │
        └────────────┘    └───────────┘
```

### Data Flow

1. **User Input** → Claude Desktop receives natural language request
2. **Tool Selection** → Claude determines which MCP tool to use
3. **Tool Execution** → MCP server receives tool call with parameters
4. **Data Processing** → Server fetches/processes data from APIs/database
5. **Response** → Formatted results returned to Claude
6. **AI Analysis** → Claude analyzes results and presents insights

## Installation

### Automated Setup (Recommended)

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

### Manual Setup

1. **Install uv package manager:**

   **Windows:**
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

   **macOS/Linux:**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Create virtual environment:**
   ```bash
   uv venv
   ```

3. **Activate environment:**

   **Windows:**
   ```powershell
   .venv\Scripts\activate
   ```

   **macOS/Linux:**
   ```bash
   source .venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   uv add "mcp[cli]" httpx psycopg2-binary python-dotenv
   ```

## Configuration

### Environment Variables

Create `.env` file in the `seo-toolkit` directory:

```bash
# Required for Lighthouse audits
GOOGLE_API_KEY=your_google_api_key_here

# Required for keyword research and competitor analysis
SEMRUSH_API_KEY=your_semrush_api_key_here

# Required for AI content analysis
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required for web scraping and technical SEO
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Database configuration
SQLITE_PATH=../../data/geo-seo.db
# OR for PostgreSQL
# DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### API Key Acquisition

| Service | URL | Cost | Free Tier |
|---------|-----|------|-----------|
| Google PageSpeed | https://developers.google.com/speed/docs/insights/v5/get-started | Free | 25,000 req/day |
| SEMrush | https://www.semrush.com/api-analytics/ | Paid | Trial available |
| Anthropic | https://console.anthropic.com/ | Usage-based | $5 free credit |
| Firecrawl | https://firecrawl.dev/ | Freemium | 500 pages/month |

### Claude Desktop Configuration

**Location:**
- **Windows:** `%AppData%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**Configuration:**

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

**Important Notes:**
- Use absolute paths (not relative)
- Use double backslashes on Windows (`\\`)
- Use forward slashes on macOS/Linux (`/`)
- API keys in `env` section override `.env` file

## Tool Reference

### Technical SEO Tools

#### run_lighthouse_audit

Run comprehensive Lighthouse performance audit.

**Parameters:**
- `url` (string, required) - Website URL to audit
- `strategy` (string, optional) - "mobile" or "desktop" (default: "mobile")

**Returns:**
- Performance score (0-100)
- Accessibility score (0-100)
- Best practices score (0-100)
- SEO score (0-100)
- Core Web Vitals metrics
- Top improvement opportunities

**Example:**
```
You: "Run a mobile Lighthouse audit for https://example.com"
Claude: [Returns detailed performance metrics and recommendations]
```

#### analyze_technical_seo

Perform detailed technical SEO analysis with web scraping.

**Parameters:**
- `url` (string, required) - Website URL to analyze

**Returns:**
- Overall SEO score (0-100)
- Metadata analysis (title, description, OG tags)
- Content structure (H1, word count, links)
- Issues categorized by impact level
- Specific recommendations

**Example:**
```
You: "Analyze technical SEO for https://example.com"
Claude: [Returns comprehensive SEO analysis with actionable insights]
```

### Keyword Research Tools

#### get_keyword_data

Get comprehensive keyword metrics from SEMrush.

**Parameters:**
- `keyword` (string, required) - Keyword to analyze
- `database` (string, optional) - Country code (default: "us")

**Returns:**
- Monthly search volume
- Cost per click (CPC)
- Competition level
- Number of search results
- Trend data
- Targeting recommendation

**Example:**
```
You: "What's the search volume for 'local seo services'?"
Claude: [Returns keyword metrics and targeting advice]
```

#### find_keyword_opportunities

Discover keyword opportunities for a domain.

**Parameters:**
- `domain` (string, required) - Domain to analyze
- `database` (string, optional) - Country code (default: "us")
- `limit` (int, optional) - Max keywords to return (default: 20)

**Returns:**
- Top keywords by traffic
- Current rankings
- Search volumes
- CPC values
- Competition levels

**Example:**
```
You: "Find keyword opportunities for example.com"
Claude: [Returns ranked list of keyword opportunities]
```

### Competitor Analysis Tools

#### analyze_competitors

Identify and analyze top organic competitors.

**Parameters:**
- `domain` (string, required) - Domain to analyze
- `database` (string, optional) - Country code (default: "us")
- `limit` (int, optional) - Number of competitors (default: 10)

**Returns:**
- Top 10 competitors
- Competition level scores
- Common keywords count
- Organic traffic estimates
- AdWords data

**Example:**
```
You: "Who are the main competitors for example.com?"
Claude: [Returns competitor analysis with metrics]
```

#### get_backlink_profile

Analyze backlink profile for a domain.

**Parameters:**
- `domain` (string, required) - Domain to analyze
- `limit` (int, optional) - Number of backlinks (default: 50)

**Returns:**
- Total backlinks analyzed
- Anchor text distribution
- Top referring domains
- Link status codes
- Source page titles

**Example:**
```
You: "Analyze backlinks for example.com"
Claude: [Returns backlink analysis with anchor text breakdown]
```

### Local SEO Tools

#### analyze_local_seo

Comprehensive local SEO analysis with scoring.

**Parameters:**
- `business_name` (string, required) - Business name
- `location` (string, required) - City and state (e.g., "San Francisco, CA")

**Returns:**
- Local SEO score (0-100)
- Profile completeness check
- Citation count
- Keyword tracking count
- Prioritized recommendations

**Example:**
```
You: "Analyze local SEO for ABC Plumbing in San Francisco"
Claude: [Returns local SEO score and improvement recommendations]
```

#### find_citation_sources

Get industry-specific citation source recommendations.

**Parameters:**
- `industry` (string, required) - Business industry/category
- `location` (string, required) - City and state

**Returns:**
- Critical and high-priority sources
- Industry-specific directories
- Medium-priority sources
- Next steps checklist

**Example:**
```
You: "Where should a restaurant in Chicago build citations?"
Claude: [Returns prioritized list of citation sources]
```

### Content Optimization Tools

#### analyze_content_for_ai

Analyze content for AI search optimization (Claude, ChatGPT, Google AI).

**Parameters:**
- `url` (string, required) - URL of content to analyze
- `target_keyword` (string, optional) - Target keyword for optimization

**Returns:**
- Citation-worthiness score (0-100)
- Unique facts AI tools would cite
- Content structure quality
- E-E-A-T signals present
- Specific improvement recommendations
- Quick wins checklist

**Example:**
```
You: "How can I optimize https://example.com/blog/seo-guide for AI citations?"
Claude: [Returns AI optimization analysis with actionable steps]
```

#### generate_content_outline

Generate AI-optimized content outline.

**Parameters:**
- `topic` (string, required) - Content topic
- `industry` (string, required) - Business industry
- `location` (string, optional) - Location for local relevance

**Returns:**
- SEO-optimized title
- H2/H3 heading structure
- Key facts and statistics to include
- Expert insight angles
- Internal linking opportunities
- FAQ section
- Content optimization checklist

**Example:**
```
You: "Create a content outline for 'HVAC maintenance' in the HVAC industry"
Claude: [Returns detailed outline optimized for SEO and AI search]
```

### Database Tools

#### get_company_overview

Retrieve complete company profile from database.

**Parameters:**
- `company_name` (string, required) - Name of company

**Returns:**
- Contact information
- Business details
- Online presence (GBP, social)
- SEO metrics (audits, keywords, competitors)
- Citation count
- Last audit date

**Example:**
```
You: "Show me the overview for ABC Plumbing"
Claude: [Returns complete company profile with metrics]
```

#### get_keyword_rankings

View tracked keyword rankings for a company.

**Parameters:**
- `company_name` (string, required) - Name of company
- `limit` (int, optional) - Max keywords to show (default: 20)

**Returns:**
- All tracked keywords
- Current rankings
- Search volumes
- Difficulty scores
- Competition levels
- Last checked dates

**Example:**
```
You: "What are the keyword rankings for ABC Plumbing?"
Claude: [Returns comprehensive ranking report]
```

## Usage Examples

### Complete SEO Audit Workflow

```
Step 1: Technical Analysis
You: "Run a Lighthouse audit for https://example.com on mobile and desktop"
Claude: [Runs audits and compares mobile vs desktop performance]

Step 2: Deep Technical SEO
You: "Now analyze the technical SEO for the same URL"
Claude: [Identifies on-page SEO issues and opportunities]

Step 3: Keyword Research
You: "What keyword opportunities exist for example.com?"
Claude: [Shows top keyword opportunities with rankings]

Step 4: Competitor Analysis
You: "Who are the main competitors and how do their backlinks compare?"
Claude: [Analyzes competitors and compares backlink profiles]

Step 5: Content Strategy
You: "Based on these findings, create a content outline for [top keyword]"
Claude: [Generates optimized content outline]
```

### Local Business Optimization

```
You: "I need to optimize ABC Plumbing in San Francisco. Start with a local SEO analysis."
Claude: [Runs analyze_local_seo tool]

You: "What citation sources should they focus on?"
Claude: [Uses find_citation_sources for plumbing industry in SF]

You: "Show me their current keyword rankings"
Claude: [Retrieves rankings from database]

You: "Create a content outline for 'emergency plumber san francisco'"
Claude: [Generates local SEO-optimized outline]
```

### Competitive Research

```
You: "Analyze example.com and their top 5 competitors"
Claude: [Gets competitors, compares metrics]

You: "What keywords are they ranking for that we aren't?"
Claude: [Compares keyword opportunities between domains]

You: "How do their backlinks differ from ours?"
Claude: [Analyzes backlink profiles for all domains]
```

## Integration Workflows

### Automated Reporting

Use MCP tools to generate automated SEO reports:

1. **Monthly Performance Report:**
   - Run Lighthouse audit for all tracked URLs
   - Get keyword rankings from database
   - Analyze top competitor changes
   - Generate summary with Claude's analysis

2. **Content Gap Analysis:**
   - Find competitor keywords
   - Compare with current rankings
   - Identify content opportunities
   - Generate content outlines for gaps

3. **Local SEO Scorecard:**
   - Analyze local SEO for all clients
   - Track citation count changes
   - Monitor ranking improvements
   - Recommend next actions

### API Integration Patterns

**Batch Processing:**
```python
# Process multiple URLs in parallel
urls = ["https://example1.com", "https://example2.com"]
for url in urls:
    await run_lighthouse_audit(url, "mobile")
```

**Data Enrichment:**
```python
# Enrich database with external data
keywords = get_keyword_rankings("ABC Plumbing")
for keyword in keywords:
    data = await get_keyword_data(keyword)
    # Store enhanced data
```

**Competitive Monitoring:**
```python
# Track competitor changes
competitors = await analyze_competitors("example.com")
for comp in competitors:
    backlinks = await get_backlink_profile(comp.domain)
    # Compare and alert on changes
```

## Troubleshooting

### Common Issues

#### Server Not Detected

**Symptoms:** MCP server doesn't appear in Claude Desktop

**Solutions:**
1. Verify `claude_desktop_config.json` syntax with JSON validator
2. Check absolute path in config (use `pwd` or `echo %CD%` to get correct path)
3. Restart Claude Desktop completely (quit from menu/tray, don't just close window)
4. Check logs: `%AppData%\Claude\logs\mcp-seo-toolkit.log`

**Validation Command:**
```bash
# Test server starts correctly
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux
python server.py  # Should start without errors
```

#### API Authentication Errors

**Symptoms:** "API key not configured" errors

**Solutions:**
1. Verify API keys in `.env` file (no quotes around values)
2. Check API keys in Claude Desktop config `env` section
3. Ensure API keys are valid (test in browser/Postman)
4. Check API key quotas/limits haven't been exceeded

**Test API Keys:**
```bash
python test_server.py  # Runs connectivity tests
```

#### Database Connection Errors

**Symptoms:** "No data found" or "Database connection failed"

**Solutions:**
1. Verify database exists: Check `data/geo-seo.db` file
2. Run database initialization: `npm run db:init` from project root
3. Check database path in config (use absolute path)
4. Verify PostgreSQL connection string if using Postgres

**Test Database:**
```bash
npm run db:test  # From project root
```

#### Rate Limiting

**Symptoms:** "Too many requests" or API errors after multiple calls

**Solutions:**
1. Add delays between requests
2. Cache results when possible
3. Use batch operations instead of individual calls
4. Upgrade API plan if needed

**Recommended Limits:**
- Google PSI: Max 1 request per 2 seconds
- SEMrush: Check plan limits (typically 10-40 units/day)
- Firecrawl: Respect free tier limits (500 pages/month)

### Debugging Tools

#### Enable Verbose Logging

Add to `.env`:
```bash
LOG_LEVEL=DEBUG
```

#### Check Claude Desktop Logs

**Windows:**
```powershell
Get-Content "$env:APPDATA\Claude\logs\mcp-seo-toolkit.log" -Wait -Tail 50
```

**macOS/Linux:**
```bash
tail -f ~/Library/Logs/Claude/mcp-seo-toolkit.log
```

#### Test Individual Tools

```python
# test_individual_tool.py
import asyncio
from server import run_lighthouse_audit

async def test():
    result = await run_lighthouse_audit("https://example.com", "mobile")
    print(result)

asyncio.run(test())
```

## Advanced Topics

### Custom Tool Development

Add new tools to the server:

```python
@mcp.tool()
async def my_custom_tool(param1: str, param2: int = 10) -> str:
    """
    Description of what this tool does.

    Args:
        param1: Description of param1
        param2: Description of param2 (default: 10)

    Returns:
        Description of return value
    """
    # Implementation
    result = f"Processed {param1} with {param2}"
    return result
```

### Caching Strategy

Implement caching to reduce API calls:

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Simple in-memory cache
cache = {}

@mcp.tool()
async def cached_keyword_data(keyword: str) -> str:
    cache_key = f"keyword_{keyword}"

    # Check cache
    if cache_key in cache:
        data, timestamp = cache[cache_key]
        if datetime.now() - timestamp < timedelta(days=7):
            return data

    # Fetch fresh data
    result = await get_keyword_data(keyword)

    # Update cache
    cache[cache_key] = (result, datetime.now())

    return result
```

### Batch Operations

Process multiple items efficiently:

```python
@mcp.tool()
async def batch_lighthouse_audit(urls: list[str]) -> str:
    results = []

    for url in urls:
        result = await run_lighthouse_audit(url, "mobile")
        results.append(result)
        await asyncio.sleep(2)  # Rate limiting

    return "\n\n".join(results)
```

### Error Recovery

Implement robust error handling:

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def resilient_api_call(url: str):
    """Retry failed API calls with exponential backoff."""
    return await make_api_request(url)
```

## Performance Optimization

### Async Operations

Use concurrent requests for better performance:

```python
import asyncio

async def analyze_multiple_competitors(domains: list[str]):
    tasks = [analyze_competitors(domain) for domain in domains]
    results = await asyncio.gather(*tasks)
    return results
```

### Connection Pooling

Reuse HTTP connections:

```python
import httpx

# Global client with connection pooling
http_client = httpx.AsyncClient(
    timeout=30.0,
    limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
)

async def make_request(url: str):
    return await http_client.get(url)
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** periodically
4. **Limit database access** to read-only when possible
5. **Validate all inputs** before processing
6. **Sanitize outputs** to prevent data leakage
7. **Use HTTPS** for all API communications

## Support and Resources

- **Documentation:** See `README.md` for complete reference
- **Quick Start:** See `QUICK_START.md` for 5-minute setup
- **Test Suite:** Run `python test_server.py` to verify installation
- **MCP Guide:** See `docs/build-assistant-tools/mcp-server-guide.md`
- **Claude Desktop:** https://claude.ai/download
- **MCP Protocol:** https://modelcontextprotocol.io/

## Appendix

### Complete File Structure

```
mcp-servers/seo-toolkit/
├── .env.example                          # Environment template
├── .env                                  # Your API keys (git-ignored)
├── server.py                             # Main MCP server
├── requirements.txt                      # Python dependencies
├── pyproject.toml                        # Project configuration
├── setup.bat                             # Windows setup script
├── setup.sh                              # macOS/Linux setup script
├── test_server.py                        # Test suite
├── README.md                             # Full documentation
├── QUICK_START.md                        # Quick setup guide
├── INTEGRATION_GUIDE.md                  # This file
├── claude_desktop_config.example.json    # Config template
└── .venv/                                # Virtual environment (created during setup)
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | No | - | Google PageSpeed Insights API key |
| `SEMRUSH_API_KEY` | No | - | SEMrush API key |
| `ANTHROPIC_API_KEY` | No | - | Anthropic Claude API key |
| `FIRECRAWL_API_KEY` | No | - | Firecrawl API key |
| `SQLITE_PATH` | No | `./data/geo-seo.db` | Path to SQLite database |
| `DATABASE_URL` | No | - | PostgreSQL connection string |
| `POSTGRES_URL` | No | - | Alternative PostgreSQL connection string |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

### Tool-to-API Mapping

| Tool | Required API(s) | Fallback Behavior |
|------|-----------------|-------------------|
| `run_lighthouse_audit` | Google | Error message |
| `analyze_technical_seo` | Firecrawl | Basic analysis only |
| `get_keyword_data` | SEMrush | Error message |
| `find_keyword_opportunities` | SEMrush | Error message |
| `analyze_competitors` | SEMrush | Error message |
| `get_backlink_profile` | SEMrush | Error message |
| `analyze_local_seo` | Database | Works with DB only |
| `find_citation_sources` | None | Always works |
| `analyze_content_for_ai` | Anthropic, Firecrawl | Error message |
| `generate_content_outline` | Anthropic | Error message |
| `get_company_overview` | Database | Works with DB only |
| `get_keyword_rankings` | Database | Works with DB only |

---

**Version:** 1.0.0
**Last Updated:** 2025-01-08
**Maintained By:** GEO-SEO Domination Tool Team
