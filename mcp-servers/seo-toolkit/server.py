"""
SEO Toolkit MCP Server

A comprehensive Model Context Protocol server for SEO analysis tools.
Integrates with the GEO-SEO Domination Tool database and external APIs.

Features:
- Technical SEO audits
- Keyword research and tracking
- Competitor analysis
- Local SEO optimization
- Content optimization
- Backlink analysis
- AI search optimization strategies
"""

import os
import json
import logging
from typing import Any, Optional, Dict, List
from datetime import datetime

import httpx
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("seo-toolkit")

# Configure logging (stderr only - never use print() in STDIO mode)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# API Configuration
GOOGLE_PSI_API_BASE = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
SEMRUSH_API_BASE = "https://api.semrush.com"
CLAUDE_MODEL = "claude-sonnet-4-20250514"

# Database configuration (supports both SQLite and PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
SQLITE_PATH = os.getenv("SQLITE_PATH", "./data/geo-seo.db")

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SEMRUSH_API_KEY = os.getenv("SEMRUSH_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")


# ============================================================================
# Database Utilities
# ============================================================================

def get_db_connection():
    """Get database connection (PostgreSQL or SQLite)."""
    if DATABASE_URL:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL)
        return conn, True  # Return connection and is_postgres flag
    else:
        import sqlite3
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        return conn, False


def execute_query(query: str, params: tuple = (), fetch_one: bool = False):
    """Execute database query with proper error handling."""
    try:
        conn, is_postgres = get_db_connection()
        cursor = conn.cursor()

        # Adjust query for SQLite vs PostgreSQL
        if not is_postgres:
            query = query.replace("$1", "?").replace("$2", "?").replace("$3", "?").replace("$4", "?")

        cursor.execute(query, params)

        if fetch_one:
            result = cursor.fetchone()
            conn.close()
            return dict(result) if result else None
        else:
            results = cursor.fetchall()
            conn.close()
            return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Database error: {e}")
        return None


# ============================================================================
# Helper Functions
# ============================================================================

async def make_api_request(url: str, params: Dict = None, headers: Dict = None) -> Optional[Dict]:
    """Make HTTP API request with error handling."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            return None
        except Exception as e:
            logger.error(f"Request error: {e}")
            return None


def parse_semrush_csv(csv_data: str) -> List[Dict]:
    """Parse SEMrush CSV response into list of dictionaries."""
    lines = csv_data.strip().split('\n')
    if len(lines) < 2:
        return []

    headers = lines[0].split(';')
    results = []

    for line in lines[1:]:
        values = line.split(';')
        row = {headers[i]: values[i] if i < len(values) else '' for i in range(len(headers))}
        results.append(row)

    return results


def calculate_eeat_score(content: Dict) -> Dict[str, int]:
    """
    Calculate E-E-A-T scores based on content analysis.

    Returns scores for:
    - Experience (first-hand knowledge, case studies)
    - Expertise (credentials, depth of knowledge)
    - Authoritativeness (citations, references)
    - Trustworthiness (accuracy, transparency)
    """
    scores = {
        "experience": 50,
        "expertise": 50,
        "authoritativeness": 50,
        "trustworthiness": 50
    }

    # Experience indicators
    if content.get("has_case_studies"):
        scores["experience"] += 15
    if content.get("has_testimonials"):
        scores["experience"] += 10
    if content.get("word_count", 0) > 1500:
        scores["experience"] += 10

    # Expertise indicators
    if content.get("has_author_bio"):
        scores["expertise"] += 15
    if content.get("author_credentials"):
        scores["expertise"] += 20
    if content.get("technical_depth", "low") == "high":
        scores["expertise"] += 10

    # Authoritativeness indicators
    if content.get("external_citations", 0) > 5:
        scores["authoritativeness"] += 15
    if content.get("has_schema_markup"):
        scores["authoritativeness"] += 10
    if content.get("domain_authority", 0) > 50:
        scores["authoritativeness"] += 10

    # Trustworthiness indicators
    if content.get("has_https"):
        scores["trustworthiness"] += 10
    if content.get("has_privacy_policy"):
        scores["trustworthiness"] += 10
    if content.get("has_contact_info"):
        scores["trustworthiness"] += 15
    if content.get("last_updated"):
        scores["trustworthiness"] += 10

    # Cap at 100
    for key in scores:
        scores[key] = min(100, scores[key])

    return scores


# ============================================================================
# MCP Tools - Technical SEO Audit
# ============================================================================

@mcp.tool()
async def run_lighthouse_audit(url: str, strategy: str = "mobile") -> str:
    """
    Run a comprehensive Lighthouse audit using Google PageSpeed Insights API.

    Args:
        url: Website URL to audit
        strategy: "mobile" or "desktop" (default: "mobile")

    Returns:
        Detailed audit results with scores and recommendations
    """
    if not GOOGLE_API_KEY:
        return "Error: GOOGLE_API_KEY not configured in environment variables"

    logger.info(f"Running Lighthouse audit for {url} ({strategy})")

    params = {
        "url": url,
        "key": GOOGLE_API_KEY,
        "strategy": strategy,
        "category": ["performance", "accessibility", "best-practices", "seo"]
    }

    data = await make_api_request(GOOGLE_PSI_API_BASE, params=params)

    if not data or "lighthouseResult" not in data:
        return "Failed to retrieve Lighthouse audit data"

    result = data["lighthouseResult"]
    categories = result.get("categories", {})
    audits = result.get("audits", {})

    # Extract scores
    scores = {
        "performance": round(categories.get("performance", {}).get("score", 0) * 100),
        "accessibility": round(categories.get("accessibility", {}).get("score", 0) * 100),
        "best_practices": round(categories.get("best-practices", {}).get("score", 0) * 100),
        "seo": round(categories.get("seo", {}).get("score", 0) * 100)
    }

    # Extract key metrics
    metrics = {
        "First Contentful Paint": audits.get("first-contentful-paint", {}).get("displayValue", "N/A"),
        "Largest Contentful Paint": audits.get("largest-contentful-paint", {}).get("displayValue", "N/A"),
        "Total Blocking Time": audits.get("total-blocking-time", {}).get("displayValue", "N/A"),
        "Cumulative Layout Shift": audits.get("cumulative-layout-shift", {}).get("displayValue", "N/A"),
        "Speed Index": audits.get("speed-index", {}).get("displayValue", "N/A")
    }

    # Find opportunities for improvement
    opportunities = []
    for audit_id, audit in audits.items():
        if audit.get("score") is not None and audit.get("score") < 0.9:
            opportunities.append({
                "title": audit.get("title", ""),
                "description": audit.get("description", ""),
                "score": audit.get("score", 0)
            })

    # Format response
    response = f"""
Lighthouse Audit Results for {url} ({strategy})
{'=' * 60}

SCORES:
- Performance: {scores['performance']}/100
- Accessibility: {scores['accessibility']}/100
- Best Practices: {scores['best_practices']}/100
- SEO: {scores['seo']}/100

KEY METRICS:
- First Contentful Paint: {metrics['First Contentful Paint']}
- Largest Contentful Paint: {metrics['Largest Contentful Paint']}
- Total Blocking Time: {metrics['Total Blocking Time']}
- Cumulative Layout Shift: {metrics['Cumulative Layout Shift']}
- Speed Index: {metrics['Speed Index']}

TOP OPPORTUNITIES ({len(opportunities[:5])} shown):
"""

    for i, opp in enumerate(opportunities[:5], 1):
        response += f"\n{i}. {opp['title']} (Score: {round(opp['score'] * 100)}%)"
        response += f"\n   {opp['description']}\n"

    return response


@mcp.tool()
async def analyze_technical_seo(url: str) -> str:
    """
    Perform comprehensive technical SEO analysis using web scraping.

    Args:
        url: Website URL to analyze

    Returns:
        Technical SEO analysis with issues and recommendations
    """
    if not FIRECRAWL_API_KEY:
        return "Error: FIRECRAWL_API_KEY not configured. Using basic analysis."

    logger.info(f"Analyzing technical SEO for {url}")

    # Use Firecrawl API to scrape the page
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers=headers,
                json={
                    "url": url,
                    "formats": ["markdown", "html", "links"],
                    "onlyMainContent": False
                },
                timeout=30.0
            )
            data = response.json()
        except Exception as e:
            return f"Error scraping URL: {e}"

    if not data.get("success"):
        return f"Failed to scrape {url}"

    metadata = data.get("metadata", {})
    html = data.get("html", "")
    links = data.get("links", [])

    # Analyze metadata
    issues = []
    score = 100

    title = metadata.get("title", "")
    description = metadata.get("description", "")

    # Title analysis
    if not title:
        issues.append("❌ Missing page title (High Impact)")
        score -= 15
    elif len(title) < 30 or len(title) > 60:
        issues.append(f"⚠️ Title length ({len(title)}) should be 30-60 characters (Medium Impact)")
        score -= 5

    # Meta description analysis
    if not description:
        issues.append("❌ Missing meta description (High Impact)")
        score -= 15
    elif len(description) < 120 or len(description) > 160:
        issues.append(f"⚠️ Description length ({len(description)}) should be 120-160 characters (Medium Impact)")
        score -= 5

    # Check for Open Graph tags
    og_title = metadata.get("ogTitle")
    og_description = metadata.get("ogDescription")
    og_image = metadata.get("ogImage")

    if not og_title or not og_description or not og_image:
        issues.append("⚠️ Incomplete Open Graph tags for social sharing (Low Impact)")
        score -= 3

    # Analyze content structure
    markdown = data.get("markdown", "")
    h1_count = markdown.count("\n# ")

    if h1_count == 0:
        issues.append("❌ No H1 tag found (High Impact)")
        score -= 15
    elif h1_count > 1:
        issues.append(f"⚠️ Multiple H1 tags ({h1_count}) - recommend 1 (Medium Impact)")
        score -= 5

    # Calculate word count
    word_count = len(markdown.split())

    # Link analysis
    internal_links = [l for l in links if url.split('/')[2] in l]
    external_links = [l for l in links if url.split('/')[2] not in l]

    # Format response
    response = f"""
Technical SEO Analysis for {url}
{'=' * 60}

OVERALL SEO SCORE: {max(0, score)}/100

METADATA:
- Title: {title or 'Missing'} ({len(title)} characters)
- Description: {description or 'Missing'} ({len(description)} characters)
- Open Graph: {'Complete' if og_title and og_description and og_image else 'Incomplete'}

CONTENT STRUCTURE:
- H1 Tags: {h1_count}
- Word Count: {word_count}
- Internal Links: {len(internal_links)}
- External Links: {len(external_links)}

ISSUES FOUND ({len(issues)}):
"""

    for issue in issues:
        response += f"\n{issue}"

    if not issues:
        response += "\n✅ No major issues found!"

    response += "\n\nRECOMMENDATIONS:\n"
    if score < 80:
        response += "- Fix high-impact issues first (marked with ❌)\n"
        response += "- Address medium-impact issues (marked with ⚠️)\n"
    if word_count < 500:
        response += "- Consider adding more content (aim for 1000+ words)\n"
    if len(internal_links) < 3:
        response += "- Add more internal links to improve site structure\n"

    return response


# ============================================================================
# MCP Tools - Keyword Research
# ============================================================================

@mcp.tool()
async def get_keyword_data(keyword: str, database: str = "us") -> str:
    """
    Get comprehensive keyword data from SEMrush API.

    Args:
        keyword: Keyword to analyze
        database: Country database code (default: "us")

    Returns:
        Keyword metrics including search volume, difficulty, CPC, and trends
    """
    if not SEMRUSH_API_KEY:
        return "Error: SEMRUSH_API_KEY not configured in environment variables"

    logger.info(f"Fetching keyword data for '{keyword}' in {database} database")

    params = {
        "type": "phrase_this",
        "key": SEMRUSH_API_KEY,
        "export_columns": "Ph,Nq,Cp,Co,Nr,Td",
        "phrase": keyword,
        "database": database
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(SEMRUSH_API_BASE, params=params, timeout=30.0)
            data = response.text
        except Exception as e:
            return f"Error fetching keyword data: {e}"

    results = parse_semrush_csv(data)

    if not results:
        return f"No data found for keyword '{keyword}' in {database} database"

    row = results[0]

    return f"""
Keyword Analysis: "{keyword}" ({database.upper()})
{'=' * 60}

METRICS:
- Search Volume: {row.get('Nq', 'N/A')} searches/month
- Cost Per Click (CPC): ${row.get('Cp', 'N/A')}
- Competition: {row.get('Co', 'N/A')}
- Number of Results: {row.get('Nr', 'N/A')}
- Trend: {row.get('Td', 'N/A')}

RECOMMENDATION:
{_generate_keyword_recommendation(row)}
"""


def _generate_keyword_recommendation(data: Dict) -> str:
    """Generate keyword recommendation based on metrics."""
    try:
        volume = int(data.get('Nq', '0'))
        competition = float(data.get('Co', '0'))
    except (ValueError, TypeError):
        return "Insufficient data for recommendation"

    if volume > 10000 and competition < 0.5:
        return "⭐ Excellent opportunity - High volume with low competition"
    elif volume > 1000 and competition < 0.7:
        return "✅ Good target - Decent volume with manageable competition"
    elif volume < 100:
        return "⚠️ Low search volume - Consider for long-tail strategy only"
    elif competition > 0.8:
        return "⚠️ High competition - May require significant resources"
    else:
        return "📊 Average opportunity - Monitor and consider for content strategy"


@mcp.tool()
async def find_keyword_opportunities(domain: str, database: str = "us", limit: int = 20) -> str:
    """
    Find keyword opportunities for a domain using SEMrush organic keywords data.

    Args:
        domain: Domain to analyze
        database: Country database code (default: "us")
        limit: Maximum number of keywords to return (default: 20)

    Returns:
        List of keyword opportunities with rankings and metrics
    """
    if not SEMRUSH_API_KEY:
        return "Error: SEMRUSH_API_KEY not configured in environment variables"

    logger.info(f"Finding keyword opportunities for {domain}")

    params = {
        "type": "domain_organic",
        "key": SEMRUSH_API_KEY,
        "export_columns": "Ph,Po,Nq,Cp,Co,Tr",
        "domain": domain,
        "database": database,
        "display_limit": limit,
        "display_sort": "tr_desc"  # Sort by traffic
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(SEMRUSH_API_BASE, params=params, timeout=30.0)
            data = response.text
        except Exception as e:
            return f"Error fetching keyword opportunities: {e}"

    results = parse_semrush_csv(data)

    if not results:
        return f"No keyword data found for {domain}"

    response = f"""
Keyword Opportunities for {domain} ({database.upper()})
{'=' * 60}

Top {len(results)} Keywords by Traffic:

"""

    for i, row in enumerate(results, 1):
        response += f"{i}. {row.get('Ph', 'N/A')}\n"
        response += f"   Position: #{row.get('Po', 'N/A')} | "
        response += f"Volume: {row.get('Nq', 'N/A')} | "
        response += f"Traffic: {row.get('Tr', 'N/A')}%\n"
        response += f"   CPC: ${row.get('Cp', 'N/A')} | "
        response += f"Competition: {row.get('Co', 'N/A')}\n\n"

    return response


# ============================================================================
# MCP Tools - Competitor Analysis
# ============================================================================

@mcp.tool()
async def analyze_competitors(domain: str, database: str = "us", limit: int = 10) -> str:
    """
    Identify and analyze top organic competitors for a domain.

    Args:
        domain: Domain to analyze
        database: Country database code (default: "us")
        limit: Number of competitors to return (default: 10)

    Returns:
        List of competitors with competitive metrics
    """
    if not SEMRUSH_API_KEY:
        return "Error: SEMRUSH_API_KEY not configured in environment variables"

    logger.info(f"Analyzing competitors for {domain}")

    params = {
        "type": "domain_organic_organic",
        "key": SEMRUSH_API_KEY,
        "export_columns": "Dn,Cr,Np,Or,Ot,Oc,Ad",
        "domain": domain,
        "database": database,
        "display_limit": limit
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(SEMRUSH_API_BASE, params=params, timeout=30.0)
            data = response.text
        except Exception as e:
            return f"Error fetching competitor data: {e}"

    results = parse_semrush_csv(data)

    if not results:
        return f"No competitor data found for {domain}"

    response = f"""
Competitor Analysis for {domain} ({database.upper()})
{'=' * 60}

Top {len(results)} Organic Competitors:

"""

    for i, row in enumerate(results, 1):
        response += f"{i}. {row.get('Dn', 'N/A')}\n"
        response += f"   Competition Level: {row.get('Cr', 'N/A')}\n"
        response += f"   Common Keywords: {row.get('Np', 'N/A')}\n"
        response += f"   Organic Keywords: {row.get('Or', 'N/A')}\n"
        response += f"   Organic Traffic: {row.get('Ot', 'N/A')}\n"
        response += f"   Organic Cost: ${row.get('Oc', 'N/A')}\n"
        response += f"   AdWords Keywords: {row.get('Ad', 'N/A')}\n\n"

    return response


@mcp.tool()
async def get_backlink_profile(domain: str, limit: int = 50) -> str:
    """
    Analyze backlink profile for a domain.

    Args:
        domain: Domain to analyze
        limit: Number of backlinks to retrieve (default: 50)

    Returns:
        Backlink analysis with top referring domains and anchor text
    """
    if not SEMRUSH_API_KEY:
        return "Error: SEMRUSH_API_KEY not configured in environment variables"

    logger.info(f"Analyzing backlinks for {domain}")

    params = {
        "type": "backlinks",
        "key": SEMRUSH_API_KEY,
        "target": domain,
        "target_type": "root_domain",
        "export_columns": "source_url,source_title,target_url,anchor,response_code",
        "display_limit": limit
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(SEMRUSH_API_BASE, params=params, timeout=30.0)
            data = response.text
        except Exception as e:
            return f"Error fetching backlink data: {e}"

    results = parse_semrush_csv(data)

    if not results:
        return f"No backlink data found for {domain}"

    # Count anchor text distribution
    anchor_counts = {}
    for row in results:
        anchor = row.get('anchor', 'N/A')
        anchor_counts[anchor] = anchor_counts.get(anchor, 0) + 1

    response = f"""
Backlink Profile for {domain}
{'=' * 60}

Total Backlinks Analyzed: {len(results)}

TOP ANCHOR TEXT DISTRIBUTION:
"""

    sorted_anchors = sorted(anchor_counts.items(), key=lambda x: x[1], reverse=True)
    for anchor, count in sorted_anchors[:10]:
        response += f"\n- {anchor}: {count} backlinks"

    response += f"\n\nTOP {min(15, len(results))} BACKLINKS:\n\n"

    for i, row in enumerate(results[:15], 1):
        response += f"{i}. {row.get('source_url', 'N/A')}\n"
        response += f"   Title: {row.get('source_title', 'N/A')}\n"
        response += f"   Anchor: {row.get('anchor', 'N/A')}\n"
        response += f"   Status: {row.get('response_code', 'N/A')}\n\n"

    return response


# ============================================================================
# MCP Tools - Local SEO
# ============================================================================

@mcp.tool()
async def analyze_local_seo(business_name: str, location: str) -> str:
    """
    Analyze local SEO factors for a business.

    Args:
        business_name: Name of the business
        location: City and state (e.g., "San Francisco, CA")

    Returns:
        Local SEO analysis with recommendations
    """
    logger.info(f"Analyzing local SEO for {business_name} in {location}")

    # Query database for company data
    query = """
    SELECT c.*, COUNT(DISTINCT cit.id) as citation_count,
           COUNT(DISTINCT k.id) as keyword_count,
           AVG(comp.avg_rating) as avg_competitor_rating
    FROM companies c
    LEFT JOIN citations cit ON c.id = cit.company_id
    LEFT JOIN keywords k ON c.id = k.company_id
    LEFT JOIN competitors comp ON c.id = comp.company_id
    WHERE LOWER(c.name) LIKE LOWER($1)
      AND LOWER(c.city) LIKE LOWER($2)
    GROUP BY c.id
    """

    result = execute_query(query, (f"%{business_name}%", f"%{location.split(',')[0]}%"), fetch_one=True)

    if not result:
        return f"No data found for {business_name} in {location}. Please add the business to the database first."

    # Calculate local SEO score
    score = 0
    recommendations = []

    # GBP Profile (20 points)
    if result.get('gbp_url'):
        score += 20
    else:
        recommendations.append("❌ Set up Google Business Profile (High Priority)")

    # Citations (25 points)
    citation_count = result.get('citation_count', 0)
    if citation_count >= 50:
        score += 25
    elif citation_count >= 20:
        score += 15
        recommendations.append("⚠️ Build more local citations (Target: 50+)")
    else:
        score += 5
        recommendations.append("❌ Build local citations across directories (High Priority)")

    # Website (20 points)
    if result.get('website'):
        score += 20
    else:
        recommendations.append("❌ Add website URL")

    # Keywords (15 points)
    keyword_count = result.get('keyword_count', 0)
    if keyword_count >= 10:
        score += 15
    elif keyword_count >= 5:
        score += 10
        recommendations.append("⚠️ Track more local keywords (Target: 10+)")
    else:
        score += 5
        recommendations.append("⚠️ Add local keyword tracking")

    # Contact Info (20 points)
    if result.get('phone'):
        score += 10
    else:
        recommendations.append("❌ Add phone number")

    if result.get('address'):
        score += 10
    else:
        recommendations.append("❌ Add complete address")

    response = f"""
Local SEO Analysis: {result.get('name', business_name)}
{'=' * 60}

LOCATION: {result.get('city', '')}, {result.get('state', '')}
INDUSTRY: {result.get('industry', 'N/A')}

LOCAL SEO SCORE: {score}/100

PROFILE COMPLETENESS:
- Google Business Profile: {'✅ Connected' if result.get('gbp_url') else '❌ Not Set Up'}
- Website: {'✅ ' + result.get('website', '') if result.get('website') else '❌ Missing'}
- Phone: {'✅ ' + result.get('phone', '') if result.get('phone') else '❌ Missing'}
- Address: {'✅ Complete' if result.get('address') else '❌ Incomplete'}

LOCAL VISIBILITY METRICS:
- Local Citations: {citation_count}
- Tracked Keywords: {keyword_count}
- Average Competitor Rating: {result.get('avg_competitor_rating', 'N/A')}

RECOMMENDATIONS ({len(recommendations)}):
"""

    if recommendations:
        for rec in recommendations:
            response += f"\n{rec}"
    else:
        response += "\n✅ Local SEO profile is well-optimized!"

    return response


@mcp.tool()
async def find_citation_sources(industry: str, location: str) -> str:
    """
    Find recommended citation sources for a specific industry and location.

    Args:
        industry: Business industry/category
        location: City and state

    Returns:
        List of recommended citation sources with priority levels
    """
    logger.info(f"Finding citation sources for {industry} in {location}")

    # Universal citation sources (all industries)
    universal_sources = [
        {"name": "Google Business Profile", "priority": "Critical", "type": "Universal"},
        {"name": "Bing Places", "priority": "High", "type": "Universal"},
        {"name": "Apple Maps", "priority": "High", "type": "Universal"},
        {"name": "Yelp", "priority": "High", "type": "Universal"},
        {"name": "Facebook", "priority": "High", "type": "Universal"},
        {"name": "Yellow Pages", "priority": "Medium", "type": "Universal"},
        {"name": "Better Business Bureau", "priority": "High", "type": "Universal"},
        {"name": "Chamber of Commerce", "priority": "Medium", "type": "Local"},
    ]

    # Industry-specific sources
    industry_sources = {
        "restaurant": [
            {"name": "OpenTable", "priority": "High"},
            {"name": "TripAdvisor", "priority": "High"},
            {"name": "Zomato", "priority": "Medium"},
            {"name": "Grubhub", "priority": "Medium"},
        ],
        "legal": [
            {"name": "Avvo", "priority": "Critical"},
            {"name": "Justia", "priority": "High"},
            {"name": "FindLaw", "priority": "High"},
            {"name": "Lawyers.com", "priority": "Medium"},
        ],
        "healthcare": [
            {"name": "Healthgrades", "priority": "Critical"},
            {"name": "Vitals", "priority": "High"},
            {"name": "WebMD", "priority": "High"},
            {"name": "Zocdoc", "priority": "High"},
        ],
        "automotive": [
            {"name": "CarGurus", "priority": "High"},
            {"name": "Cars.com", "priority": "High"},
            {"name": "AutoTrader", "priority": "Medium"},
            {"name": "RepairPal", "priority": "Medium"},
        ],
        "home services": [
            {"name": "Angi", "priority": "High"},
            {"name": "HomeAdvisor", "priority": "High"},
            {"name": "Thumbtack", "priority": "High"},
            {"name": "Houzz", "priority": "Medium"},
        ],
    }

    # Find matching industry
    industry_lower = industry.lower()
    specific_sources = []
    for key, sources in industry_sources.items():
        if key in industry_lower or industry_lower in key:
            specific_sources = sources
            break

    response = f"""
Citation Sources for {industry} in {location}
{'=' * 60}

CRITICAL & HIGH PRIORITY (Build First):
"""

    # Universal sources
    for source in universal_sources:
        if source["priority"] in ["Critical", "High"]:
            response += f"\n✅ {source['name']} ({source['type']} - {source['priority']})"

    # Industry-specific
    if specific_sources:
        response += f"\n\nINDUSTRY-SPECIFIC ({industry.title()}):\n"
        for source in specific_sources:
            priority_emoji = "⭐" if source["priority"] == "Critical" else "✅" if source["priority"] == "High" else "📋"
            response += f"\n{priority_emoji} {source['name']} ({source['priority']})"

    # Medium priority
    response += "\n\nMEDIUM PRIORITY (Build After High Priority):\n"
    for source in universal_sources:
        if source["priority"] == "Medium":
            response += f"\n📋 {source['name']} ({source['type']})"

    response += f"""

NEXT STEPS:
1. Claim/verify all Critical and High priority listings
2. Ensure NAP (Name, Address, Phone) consistency across all sources
3. Complete all profile fields with detailed information
4. Add high-quality photos (minimum 5-10 per listing)
5. Actively collect and respond to reviews
6. Monitor listings monthly for accuracy
"""

    return response


# ============================================================================
# MCP Tools - Content Optimization
# ============================================================================

@mcp.tool()
async def analyze_content_for_ai(url: str, target_keyword: str = "") -> str:
    """
    Analyze content for AI search optimization (Claude, ChatGPT, Google AI).

    Args:
        url: URL of the content to analyze
        target_keyword: Optional target keyword for optimization

    Returns:
        Content analysis with AI citation optimization recommendations
    """
    if not ANTHROPIC_API_KEY:
        return "Error: ANTHROPIC_API_KEY not configured in environment variables"

    logger.info(f"Analyzing content for AI optimization: {url}")

    # Scrape content first
    if not FIRECRAWL_API_KEY:
        return "Error: FIRECRAWL_API_KEY required for content analysis"

    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers=headers,
                json={
                    "url": url,
                    "formats": ["markdown"],
                    "onlyMainContent": True
                },
                timeout=30.0
            )
            scrape_data = response.json()
        except Exception as e:
            return f"Error scraping content: {e}"

    if not scrape_data.get("success"):
        return "Failed to scrape content"

    content = scrape_data.get("markdown", "")[:4000]  # Limit content for analysis

    # Use Claude to analyze for AI optimization
    prompt = f"""Analyze this content for AI search optimization (Claude, ChatGPT, Google AI Overviews):

URL: {url}
Target Keyword: {target_keyword or 'Not specified'}

Content Preview:
{content}

Provide:
1. Citation-worthiness score (0-100) and reasoning
2. Unique facts/data points AI tools would cite
3. Content structure quality for AI parsing
4. E-E-A-T signals present
5. Specific improvements to increase AI citations

Be concise and actionable."""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 2048,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=60.0
            )

            result = response.json()
            analysis = result["content"][0]["text"]
    except Exception as e:
        return f"Error analyzing with Claude: {e}"

    return f"""
AI Search Optimization Analysis
{'=' * 60}

URL: {url}
Target Keyword: {target_keyword or 'Not specified'}

{analysis}

QUICK WINS FOR AI CITATIONS:
- Add unique statistics and data points
- Include expert quotes and attributions
- Structure with clear H2/H3 headings
- Add FAQ section with natural language questions
- Include publication/update dates
- Link to authoritative sources
- Add author bio with credentials
- Use schema markup (Article, FAQPage, etc.)
"""


@mcp.tool()
async def generate_content_outline(topic: str, industry: str, location: str = "") -> str:
    """
    Generate an AI-optimized content outline for a topic.

    Args:
        topic: Content topic
        industry: Business industry
        location: Optional location for local relevance

    Returns:
        Detailed content outline optimized for both traditional and AI search
    """
    if not ANTHROPIC_API_KEY:
        return "Error: ANTHROPIC_API_KEY not configured in environment variables"

    logger.info(f"Generating content outline for: {topic}")

    location_context = f" in {location}" if location else ""

    prompt = f"""Create a comprehensive content outline optimized for AI search visibility:

Topic: {topic}
Industry: {industry}
Location: {location or 'Not specified'}

Provide:
1. SEO-optimized title (for both traditional and AI search)
2. Content structure with H2/H3 headings
3. Key facts and statistics to include (citeable by AI)
4. Expert insights and first-hand experience angles
5. Internal linking opportunities
6. FAQ section with AI-common questions
7. Unique data points to own in this topic space

Format as a practical outline ready for content creation."""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 3072,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=60.0
            )

            result = response.json()
            outline = result["content"][0]["text"]
    except Exception as e:
        return f"Error generating outline: {e}"

    return f"""
AI-Optimized Content Outline
{'=' * 60}

Topic: {topic}{location_context}
Industry: {industry}

{outline}

CONTENT OPTIMIZATION CHECKLIST:
☐ Include unique research or data
☐ Add expert quotes with credentials
☐ Use clear, scannable structure (H2/H3)
☐ Add FAQ section at the end
☐ Include last updated/published date
☐ Link to 3-5 authoritative sources
☐ Add schema markup (Article, FAQPage)
☐ Include author bio with E-E-A-T signals
☐ Optimize images with descriptive alt text
☐ Add table of contents for long-form content
"""


# ============================================================================
# MCP Tools - Database Operations
# ============================================================================

@mcp.tool()
async def get_company_overview(company_name: str) -> str:
    """
    Get comprehensive overview of a company from the database.

    Args:
        company_name: Name of the company to look up

    Returns:
        Complete company profile with SEO metrics
    """
    logger.info(f"Fetching company overview for: {company_name}")

    query = """
    SELECT c.*,
           COUNT(DISTINCT a.id) as audit_count,
           COUNT(DISTINCT k.id) as keyword_count,
           COUNT(DISTINCT comp.id) as competitor_count,
           COUNT(DISTINCT cit.id) as citation_count,
           MAX(a.audit_date) as last_audit_date
    FROM companies c
    LEFT JOIN audits a ON c.id = a.company_id
    LEFT JOIN keywords k ON c.id = k.company_id
    LEFT JOIN competitors comp ON c.id = comp.company_id
    LEFT JOIN citations cit ON c.id = cit.company_id
    WHERE LOWER(c.name) LIKE LOWER($1)
    GROUP BY c.id
    """

    result = execute_query(query, (f"%{company_name}%",), fetch_one=True)

    if not result:
        return f"No company found matching '{company_name}'. Please check the name or add the company to the database."

    response = f"""
Company Overview: {result.get('name', 'N/A')}
{'=' * 60}

CONTACT INFORMATION:
- Address: {result.get('address', 'N/A')}
- City/State: {result.get('city', 'N/A')}, {result.get('state', 'N/A')} {result.get('zip', 'N/A')}
- Phone: {result.get('phone', 'N/A')}
- Email: {result.get('email', 'N/A')}
- Website: {result.get('website', 'N/A')}

BUSINESS DETAILS:
- Industry: {result.get('industry', 'N/A')}
- Services: {result.get('services', 'N/A')}
- Description: {result.get('description', 'N/A')}

ONLINE PRESENCE:
- Google Business Profile: {result.get('gbp_url', 'Not set up')}
- Social Profiles: {result.get('social_profiles', 'None')}

SEO METRICS:
- Total Audits: {result.get('audit_count', 0)}
- Last Audit: {result.get('last_audit_date', 'Never')}
- Tracked Keywords: {result.get('keyword_count', 0)}
- Tracked Competitors: {result.get('competitor_count', 0)}
- Citations: {result.get('citation_count', 0)}

CREATED: {result.get('created_at', 'N/A')}
LAST UPDATED: {result.get('updated_at', 'N/A')}
"""

    return response


@mcp.tool()
async def get_keyword_rankings(company_name: str, limit: int = 20) -> str:
    """
    Get current keyword rankings for a company.

    Args:
        company_name: Name of the company
        limit: Maximum number of keywords to return (default: 20)

    Returns:
        List of tracked keywords with current rankings
    """
    logger.info(f"Fetching keyword rankings for: {company_name}")

    query = """
    SELECT k.keyword, k.location, k.current_rank, k.search_volume,
           k.difficulty, k.competition_level, k.last_checked
    FROM keywords k
    JOIN companies c ON k.company_id = c.id
    WHERE LOWER(c.name) LIKE LOWER($1)
    ORDER BY k.current_rank ASC, k.search_volume DESC
    LIMIT $2
    """

    results = execute_query(query, (f"%{company_name}%", limit))

    if not results:
        return f"No keyword data found for '{company_name}'"

    response = f"""
Keyword Rankings: {company_name}
{'=' * 60}

Total Tracked Keywords: {len(results)}

"""

    for i, row in enumerate(results, 1):
        rank_display = f"#{row.get('current_rank')}" if row.get('current_rank') else "Unranked"
        response += f"{i}. {row.get('keyword', 'N/A')} ({row.get('location', 'N/A')})\n"
        response += f"   Rank: {rank_display} | "
        response += f"Volume: {row.get('search_volume', 'N/A')} | "
        response += f"Difficulty: {row.get('difficulty', 'N/A')}/100\n"
        response += f"   Competition: {row.get('competition_level', 'N/A')} | "
        response += f"Last Checked: {row.get('last_checked', 'N/A')}\n\n"

    return response


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Initialize and run the MCP server."""
    logger.info("Starting SEO Toolkit MCP Server...")

    # Verify API keys
    missing_keys = []
    if not GOOGLE_API_KEY:
        missing_keys.append("GOOGLE_API_KEY")
    if not SEMRUSH_API_KEY:
        missing_keys.append("SEMRUSH_API_KEY")
    if not ANTHROPIC_API_KEY:
        missing_keys.append("ANTHROPIC_API_KEY")
    if not FIRECRAWL_API_KEY:
        missing_keys.append("FIRECRAWL_API_KEY")

    if missing_keys:
        logger.warning(f"Missing API keys: {', '.join(missing_keys)}")
        logger.warning("Some features will be unavailable without these keys")

    # Run the server
    mcp.run(transport='stdio')


if __name__ == "__main__":
    main()
