# SEO Audit MCP Server

Custom Model Context Protocol server providing comprehensive SEO auditing tools.

## Features

### 7 Powerful SEO Tools:

1. **technical_audit** - Full technical SEO analysis
   - HTTPS check
   - Robots.txt validation
   - XML sitemap check
   - Meta tags analysis
   - HTTP headers review
   - URL structure evaluation
   - Canonical tags verification

2. **performance_audit** - Page speed & Core Web Vitals
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)
   - TTFB (Time to First Byte)
   - FCP (First Contentful Paint)
   - Performance recommendations

3. **mobile_audit** - Mobile-friendliness check
   - Viewport configuration
   - Text readability
   - Tap target sizing
   - Horizontal scroll detection
   - Touch-friendly navigation
   - Mobile load speed

4. **eeat_score** - E-E-A-T scoring (Google's quality guidelines)
   - Experience signals
   - Expertise indicators
   - Authoritativeness metrics
   - Trust factors
   - Comprehensive recommendations

5. **schema_validator** - Structured data validation
   - JSON-LD detection
   - Schema.org compliance
   - Missing properties identification
   - Rich results optimization

6. **accessibility_audit** - WCAG compliance check
   - Alt text verification
   - Heading structure
   - Color contrast
   - Keyboard navigation
   - ARIA landmarks
   - Form label validation

7. **security_audit** - Security best practices
   - HTTPS enforcement
   - Security headers (HSTS, CSP, X-Frame-Options)
   - Referrer policy
   - Permissions policy
   - Security recommendations

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python server.py
```

## Usage with Claude

Add to your `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "seo-audit": {
      "command": "python",
      "args": ["D:\\GEO_SEO_Domination-Tool\\mcp-servers\\seo-audit\\server.py"]
    }
  }
}
```

## Example Queries

### Technical Audit
```
Run a technical SEO audit on https://example.com
```

### Performance Analysis
```
Analyze page speed for https://example.com on mobile
```

### E-E-A-T Score
```
Calculate E-E-A-T score for https://example.com with author bios, 5-year domain age, and HTTPS
```

### Complete SEO Audit
```
Run all SEO audits (technical, performance, mobile, E-E-A-T, schema, accessibility, security) on https://example.com
```

## Tool Parameters

### technical_audit
- `url` (required): Website URL
- `check_robots`: Check robots.txt (default: true)
- `check_sitemap`: Validate sitemap (default: true)
- `check_meta`: Analyze meta tags (default: true)
- `check_headers`: Check HTTP headers (default: true)

### performance_audit
- `url` (required): Website URL
- `device`: 'desktop' or 'mobile' (default: 'desktop')

### mobile_audit
- `url` (required): Website URL

### eeat_score
- `url` (required): Website URL
- `has_author_bio`: Author credentials displayed
- `has_citations`: External references present
- `https_enabled`: HTTPS implemented
- `has_contact_page`: Contact information available
- `has_privacy_policy`: Privacy policy present
- `domain_age_years`: Domain age in years
- `has_about_page`: About page exists

### schema_validator
- `url` (required): Website URL
- `schema_type`: Specific schema to validate (optional)

### accessibility_audit
- `url` (required): Website URL

### security_audit
- `url` (required): Website URL

## Output Format

All tools return structured JSON with:
- `score`: Numeric score (0-100)
- `grade`: Letter grade (A+ to F)
- `issues`: Critical problems found
- `warnings`: Non-critical issues
- `successes`: Passed checks
- `recommendations`: Actionable improvements

## Integration with Guardian System

This MCP server integrates with the Guardian System for:
- Automated SEO health monitoring
- Continuous site auditing
- Issue detection and alerting
- Performance tracking over time

## Future Enhancements

- Real HTTP request implementation
- Integration with Google PageSpeed Insights API
- Lighthouse API integration
- Backlink analysis
- Competitor comparison
- Historical trend tracking
- Automated fix suggestions

## License

MIT License - Part of GEO-SEO Domination Tool
